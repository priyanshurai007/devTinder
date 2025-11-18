const mongoose = require("mongoose");

/**
 * Connect to MongoDB. Uses `MONGO_URI` or `DATABASE_URL` from env.
 * Throws on failure so the caller can avoid starting the server.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "MongoDB connection string not provided. Set MONGO_URI or DATABASE_URL in your .env"
    );
  }

  try {
    // Connect using the driver defaults; recent MongoDB driver versions
    // ignore the legacy options `useNewUrlParser` and `useUnifiedTopology`.
    await mongoose.connect(uri);
    // Optional success log: enabled by default, disable by setting SHOW_DB_LOGS=false
    const showLog = process.env.SHOW_DB_LOGS !== 'false';
    if (showLog) console.log('MongoDB connected successfully');
    return mongoose;
  } catch (err) {
    // rethrow so the server process can decide how to handle startup failure
    throw new Error(`Failed to connect to MongoDB: ${err.message}`);
  }
};

module.exports = connectDB;
