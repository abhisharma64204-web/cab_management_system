const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const user = process.env.MONGO_USER;
    const pass = encodeURIComponent(process.env.MONGO_PASS);
    const cluster = process.env.MONGO_CLUSTER;
    const db = process.env.MONGO_DB;

    const mongoURI = `mongodb+srv://${user}:${pass}@${cluster}/${db}?retryWrites=true&w=majority&appName=Cluster0`;

    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
