require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const healthRouter = require("./routes/health");
const merchantsRouter = require("./routes/merchants");
const bookingsRouter = require("./routes/bookings");
const webhookRoutes = require("./routes/webhook");

const app = express();

let isConnected = false;

async function connectMongo() {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "test",
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
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
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

const adminBookingsRouter = require("./routes/adminBookings");
app.use("/api/admin/bookings", adminBookingsRouter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Booking Engine API Running 🚀",
  });
});

module.exports = app;