import mongoose from "mongoose";

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * - Skips (with a warning) if MONGO_URI is not set — useful during early dev
 *   so the server can still boot and /api/health can be tested.
 * - Exits the process on a real connection failure.
 */
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn(
      "⚠️  MONGO_URI is not set. Skipping MongoDB connection. " +
        "Add it to backend/.env before using any database features."
    );
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
