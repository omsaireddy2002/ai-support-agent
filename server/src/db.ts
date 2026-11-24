// db.ts — connects to MongoDB Atlas once, when the server starts.
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // Fail fast with a clear message instead of a confusing error later.
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to server/.env");
  }

  // dbName picks the database inside your Atlas cluster. Your URI doesn't name
  // one, so without this Mongoose would quietly use a database called "test".
  await mongoose.connect(uri, { dbName: "support-desk" });

  // Never log the URI itself: it contains your password.
  console.log("Connected to MongoDB");
}
