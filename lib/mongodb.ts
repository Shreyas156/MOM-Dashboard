import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI || '';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    if (!globalThis._mongoClientPromise) {
      client = new MongoClient(uri);
      globalThis._mongoClientPromise = client.connect();
    }
    clientPromise = globalThis._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export async function getDatabase() {
  if (!uri || !clientPromise) return null;
  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db('mom_dashboard');

    // Automatically set up 7-day TTL auto-delete index on moms collection to keep storage 100% free forever
    try {
      await db.collection('moms').createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 7 * 24 * 60 * 60, name: 'auto_delete_old_moms' } // auto-deletes logs after 7 days
      );
    } catch (e) {
      // Index already exists
    }

    return db;
  } catch (e) {
    console.error('MongoDB connection error:', e);
    return null;
  }
}
