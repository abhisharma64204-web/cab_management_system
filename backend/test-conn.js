const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const testConnection = async () => {
  try {
    const user = process.env.MONGO_USER;
    const pass = encodeURIComponent(process.env.MONGO_PASS); // Safely encodes the '@' character
    const cluster = process.env.MONGO_CLUSTER;
    const db = process.env.MONGO_DB;

    // Dynamically construct the URI
    const mongoURI = `mongodb+srv://${user}:${pass}@${cluster}/${db}?retryWrites=true&w=majority&appName=Cluster0`;

    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();
