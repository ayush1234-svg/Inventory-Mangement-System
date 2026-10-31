import path from 'path';
import { env } from './env.js';

export const uploadsDir = path.resolve(process.cwd(), env.UPLOADS_DIR);
