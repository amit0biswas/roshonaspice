import mongoose from "mongoose";

export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
      console.info("Connected to MongoDB");
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Could not connect to MongoDB after ${maxAttempts} attempts. Check Atlas availability, credentials, and network access.`, { cause: error });
      }
      console.warn(`MongoDB connection attempt ${attempt} failed; retrying shortly.`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
}
