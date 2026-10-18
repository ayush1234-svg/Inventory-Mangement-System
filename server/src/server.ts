import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { ensureInitialOwner } from './services/authService.js';
import { getShopSettings } from './services/settingsService.js';

async function bootstrap() {
  try {
    await connectDB();

    // Ensure shop owner exists & shop settings are initialized
    await ensureInitialOwner();
    await getShopSettings();

    app.listen(env.PORT, () => {
      console.log(`🚀 WTL Mobile Shop Server running at http://localhost:${env.PORT}`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
