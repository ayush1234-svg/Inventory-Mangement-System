import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/wtl_inventory'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  UPLOADS_DIR: z.string().default('uploads'),
  INITIAL_ADMIN_NAME: z.string().trim().min(1).optional(),
  INITIAL_ADMIN_EMAIL: z.string().trim().email().transform((email) => email.toLowerCase()).optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(16).optional(),
  // Cloudinary (optional — local disk storage used as fallback when not set)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.cwd() ? process.env : {});

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
