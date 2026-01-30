const mongoose = require("mongoose");

exports.connect = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.DATABASE;
    if (!uri) {
      console.error("❌ CRITICAL: Missing MONGO_URI in environment variables!");
      throw new Error("Missing MONGO_URI/DATABASE in .env");
    }

    // Mask password for logging safety
    const maskedUri = uri.replace(/:([^:@]+)@/, ":****@");
    console.log(`🔌 Attempting to connect to MongoDB at: ${maskedUri}`);

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB Successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    // Do not exit process immediately on Render, let it retry or log the error
    // process.exit(1); 
  }
};
