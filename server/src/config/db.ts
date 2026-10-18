import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(uriOverride?: string): Promise<typeof mongoose> {
  const uri = uriOverride || env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true, // Build indexes automatically in app initialization
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('📦 MongoDB Disconnected');
  } catch (error) {
    console.error('❌ MongoDB Disconnection Error:', error);
  }
}
