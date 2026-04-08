import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const opts = {
      bufferCommands: true, // Keep this true but make sure we connect
      serverSelectionTimeoutMS: 15000, // Timeout after 15s instead of default
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, opts);
    isConnected = !!conn.connections[0].readyState;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Not exiting in hosted environment might be better to let next request retry
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;

