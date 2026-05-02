require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health");
const merchantsRouter = require("./routes/merchants");
const bookingsRouter = require("./routes/bookings");
const webhookRoutes = require("./routes/webhook");

const app = express();

// 🚨 直接全开放 CORS（先跑通）
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

console.log("🔥 APP USING ROUTES");

// webhook 要放前面
app.use("/api/webhook", webhookRoutes);

app.use(express.json());

// API routes
app.use("/api/health", healthRouter);
app.use("/api/merchants", merchantsRouter);
app.use("/api/bookings", bookingsRouter);

const adminBookingsRouter = require("./routes/adminBookings");
app.use("/api/admin/bookings", adminBookingsRouter);

// root test
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Booking Engine API Running 🚀",
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

module.exports = app;