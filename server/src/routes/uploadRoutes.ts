import crypto from 'crypto';
import { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { uploadsDir } from '../config/uploads.js';
import { cloudinary, cloudinaryEnabled } from '../config/cloudinary.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Only create the local uploads dir when Cloudinary is not configured
if (!cloudinaryEnabled && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedMimeTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { image, filename } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'No image data provided. Please provide an image Data URL.',
      });
    }

    // Match data:<mediatype>[;base64],<data>
    const matches = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Expected a base64 Data URL (e.g. data:image/jpeg;base64,...)',
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const ext = allowedMimeTypes[mimeType];
    if (!ext) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported image type. Please upload a JPG, PNG, WebP, or GIF image.',
      });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    // Limit to 10 MB
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size exceeds maximum limit of 10MB.',
      });
    }

    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const sanitizedName = filename
      ? path.parse(filename).name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
      : 'product';
    const publicId = `${sanitizedName}_${Date.now()}_${randomSuffix}`;

    // ── Cloudinary path ──────────────────────────────────────────────────────
    if (cloudinaryEnabled) {
      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'wtl-inventory',
              public_id: publicId,
              resource_type: 'image',
              // Automatically convert to WebP for smaller sizes
              format: 'webp',
              transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            },
            (error, result) => {
              if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
              resolve(result as { secure_url: string; public_id: string });
            }
          );
          uploadStream.end(buffer);
        }
      );

      return res.status(201).json({
        success: true,
        message: 'Image uploaded successfully.',
        data: {
          url: uploadResult.secure_url,        // absolute HTTPS Cloudinary URL
          filename: uploadResult.public_id,
          size: buffer.length,
          mimeType,
        },
      });
    }

    // ── Local disk fallback (development) ────────────────────────────────────
    const uniqueFilename = `${publicId}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    await fs.promises.writeFile(filePath, buffer);

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        url: `/uploads/${uniqueFilename}`,    // relative URL resolved by the client
        filename: uniqueFilename,
        size: buffer.length,
        mimeType,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image.',
    });
  }
});

export default router;
