import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: Cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

async function connectWithRetry(retryCount = 0): Promise<typeof mongoose> {
  try {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      family: 4, // Use IPv4
    };

    return await mongoose.connect(MONGODB_URI as string, opts);
  } catch (e) {
    if (retryCount < MAX_RETRIES) {
      console.warn(
        `[MongoDB] Connection failed, retrying... (${retryCount + 1}/${MAX_RETRIES})`,
        e instanceof Error ? e.message.substring(0, 100) : 'Unknown error'
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return connectWithRetry(retryCount + 1);
    }
    throw e;
  }
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithRetry();
  }

  try {
    cached.conn = await cached.promise;
    console.log('✓ [MongoDB] Connected successfully');
  } catch (e) {
    cached.promise = null;
    console.error('[MongoDB] Connection failed:', e instanceof Error ? e.message.substring(0, 150) : 'Unknown error');
    // Graceful degradation - allow app to work without DB in dev
    return null;
  }

  return cached.conn;
}

/**
 * Initialize database indexes
 * Call this once on app startup
 */
export async function initializeIndexes() {
  try {
    const conn = await connectDB();

    if (!conn) {
      console.warn('[Indexes] Skipped (database not connected)');
      return;
    }

    const db = conn.connection.db;

    if (db) {
      // Create indexes for optimized queries
      await db.collection('generatedcontents').createIndex({ createdAt: -1 });
      await db.collection('generatedcontents').createIndex({ sourceType: 1 });
      await db.collection('generatedcontents').createIndex({ sourceUrl: 1 });

      console.log('✓ [Indexes] Created successfully');
    }
  } catch (error) {
    console.warn('[Indexes] Creation skipped:', error instanceof Error ? error.message.substring(0, 100) : 'Unknown error');
  }
}
