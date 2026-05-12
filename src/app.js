const customerAuthRouter = require("./routes/customerAuth").default || require("./routes/customerAuth");
const reviewRankingsRouter = require("./routes/reviewRankings").default || require("./routes/reviewRankings");
const reviewSummaryRouter = require("./routes/reviewSummary").default || require("./routes/reviewSummary");
const adminReviewsRouter = require("./routes/adminReviews").default || require("./routes/adminReviews");
const chefsRouter = require("./routes/chefs").default || require("./routes/chefs");
const customersRouter = require("./routes/customers").default || require("./routes/customers");
const customerDashboardRouter = require("./routes/customerDashboard").default || require("./routes/customerDashboard");
// src/app.js 是整个 booking-engine-api 的“总入口文件”。
require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env" : ".env.local",
});
const adminDashboardRouter = require("./routes/adminDashboard");
const authRoutes = require("./routes/authRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const healthRouter = require("./routes/health");
const merchantsRouter = require("./routes/merchants");
const reviewsRouter = require("./routes/reviews").default || require("./routes/reviews");
const bookingsRouter = require("./routes/bookings");
const webhookRoutes = require("./routes/webhook");
const paymentsRouter = require("./routes/payments");
const adminBookingsRouter = require("./routes/adminBookings");
const adminMerchantSettingsRouter = require("./routes/adminMerchantSettings");
const adminUploadRouter = require("./routes/adminUpload");
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
  console.log(
  `✅ MongoDB Connected -> ${process.env.MONGODB_DB_NAME}`,
);
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

      "https://www.shuilink.com",
      "https://shuilink.com",

      "https://hibachifinder.com",
      "https://www.hibachifinder.com",
      "https://booking.hibachifinder.com",
      "https://app.hibachifinder.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
app.use("/api/reviews", reviewsRouter);
app.use("/api/review-summary", reviewSummaryRouter);
app.use("/api/review-rankings", reviewRankingsRouter);
app.use("/api/chefs", chefsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/customer-auth", customerAuthRouter);
app.use("/api/customer-dashboard", customerDashboardRouter);
app.use("/api/auth", authRoutes);

app.use("/api/admin/bookings", adminBookingsRouter);
app.use("/api/admin/merchant-settings", adminMerchantSettingsRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/reviews", adminReviewsRouter);
app.use("/api/admin/upload", adminUploadRouter);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Booking Engine API Running 🚀",
  });
});

module.exports = app;