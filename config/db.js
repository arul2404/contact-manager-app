const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/contact_manager_db';

  try {
    console.log(`📡 Attempting to connect to MongoDB at: ${connUri}`);
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Could not connect to local MongoDB (${error.message}).`);
    
    // Fallback to in-memory MongoDB for seamless out-of-the-box local development & testing
    try {
      console.log('⚡ Initializing in-memory MongoDB fallback server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      
      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ In-Memory MongoDB Connected: ${memoryUri}`);
      console.log('💡 Note: Data will be persisted for the duration of the server process. To use permanent storage, run MongoDB locally or configure Atlas MONGO_URI in .env');
      return conn;
    } catch (memErr) {
      console.error(`❌ Failed to start database: ${memErr.message}`);
    }
  }
};

module.exports = connectDB;
