const mongoose = require('mongoose');

/**
 * Global cache for MongoDB connection across serverless invocations (Vercel)
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    const errorMsg =
      'MongoDB configuration error: MONGO_URI is not defined. Please add MONGO_URI in your Vercel Project Settings -> Environment Variables.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // If already connected and ready, reuse connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
    };

    console.log('📡 Connecting to MongoDB Atlas...');
    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`✅ MongoDB Connected successfully: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error('❌ MongoDB Connection Error:', err.message);
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
