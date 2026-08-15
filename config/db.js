const mongoose = require('mongoose');

const connectDB = async () => {
  // Already connected - reuse
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Currently connecting - wait for it to finish
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
    return;
  }

  // Not connected - connect now
  console.log('📡 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
  });
  console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
};

module.exports = connectDB;
