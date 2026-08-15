const mongoose = require('mongoose');

// Cache the connection across serverless function calls
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    console.log(`📡 Connecting to MongoDB Atlas...`);
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
