// 负责连接 MongoDB 数据库，供 booking、后台订单和未来商家后台使用。

const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in .env");
  }

  await mongoose.connect(mongoUri);

  isConnected = true;
  console.log("✅ MongoDB connected");
}

module.exports = connectDB;