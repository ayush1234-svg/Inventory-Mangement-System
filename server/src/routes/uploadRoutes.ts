import crypto from 'crypto';
import { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { image, filename } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'No image data provided. Please provide an image Data URL.',
      });
    }

    // Match data:[<mediatype>][;base64],<data>
    const matches = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Expected a base64 Data URL (e.g. data:image/jpeg;base64,...)',
      });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const allowedMimeTypes: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
    };

    const ext = allowedMimeTypes[mimeType];
    if (!ext) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported image type. Please upload a JPG, PNG, WebP, or GIF image.',
      });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    // Limit to 10MB
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
    const uniqueFilename = `${sanitizedName}_${Date.now()}_${randomSuffix}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueFilename}`;

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully.',
      data: {
        url: relativeUrl,
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
