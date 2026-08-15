const mongoose = require('mongoose');

// Cache the connection across serverless function calls
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Return cached connection if available
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  // If no pending promise, create one
  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
    };

    console.log(`📡 Connecting to MongoDB Atlas...`);
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((m) => {
        console.log(`✅ MongoDB Connected: ${m.connection.host}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null; // Reset so next request retries
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
