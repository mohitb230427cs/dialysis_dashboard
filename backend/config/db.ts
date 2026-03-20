import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined. Add it to your .env file or environment secrets.');
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
}
