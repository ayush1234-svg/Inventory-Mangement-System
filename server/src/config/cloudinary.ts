import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

/**
 * True when all three Cloudinary credentials are present in the environment.
 * Falls back to local disk storage when false (e.g. during local development).
 */
export const cloudinaryEnabled =
  !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️  Cloudinary storage enabled');
} else {
  console.log('📁 Local disk storage enabled (set CLOUDINARY_* env vars to use Cloudinary)');
}

export { cloudinary };

