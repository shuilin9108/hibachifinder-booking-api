require("dotenv").config();
// src/app.js 是整个 booking-engine-api 的“总入口文件”。
const authRoutes = require("./routes/authRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const healthRouter = require("./routes/health");
const merchantsRouter = require("./routes/merchants");
const bookingsRouter = require("./routes/bookings");
const webhookRoutes = require("./routes/webhook");
const paymentsRouter = require("./routes/payments");
const adminBookingsRouter = require("./routes/adminBookings");
const adminMerchantSettingsRouter = require("./routes/adminMerchantSettings");

const app = express();

let isConnected = false;

async function connectMongo() {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || "hibachifinder",
  });

  isConnected = true;
  console.log("✅ MongoDB Connected");
}

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",

      "https://hibachifinder-booking-web.vercel.app",
      "https://hibachifinder-booking-bfxy2v2ij-shui-lins-projects.vercel.app",

      "https://www.a1hibachiparty.com",
      "https://a1hibachiparty.com",

      "https://www.hibachinearby.com",
      "https://hibachinearby.com",

      "https://www.kobehibachicatering.com",
      "https://kobehibachicatering.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  }),
);

app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    console.error("❌ Mongo connect failed:", err);
    return res.status(500).json({
      success: false,
      error: "DB connection failed",
      details: err.message,
    });
  }
});

app.use("/api/webhook", webhookRoutes);
app.use("/api/health", healthRouter);
app.use("/api/merchants", merchantsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/auth", authRoutes);

app.use("/api/admin/bookings", adminBookingsRouter);
app.use("/api/admin/merchant-settings", adminMerchantSettingsRouter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Booking Engine API Running 🚀",
  });
});

module.exports = app;