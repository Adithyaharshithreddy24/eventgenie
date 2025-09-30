// db.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI; // Make sure .env has your Atlas URI
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbInstance;

async function connectDB() {
  try {
    if (!dbInstance) {
      await client.connect();
      console.log("✅ MongoDB connected to Atlas!");
      dbInstance = client.db("eventgenie"); // keep the same as your local DB name
    }
    return dbInstance;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

module.exports = connectDB;
