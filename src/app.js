require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health");
const merchantsRouter = require("./routes/merchants");
const bookingsRouter = require("./routes/bookings");

const app = express();

// ✅ CORS（生产 + 本地都支持）
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://www.kobehibachicatering.com",
      "https://kobehibachicatering.com",
      "https://booking-engine-web-kv8t.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);

// ✅ JSON 解析
app.use(express.json());

// ✅ Debug log（保留）
console.log("🔥 APP USING ROUTES");

// ✅ Routes
app.use("/api/health", healthRouter);
app.use("/api/merchants", merchantsRouter);
app.use("/api/bookings", bookingsRouter);

// ✅ 根路径（Vercel健康检查）
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Booking Engine API Running 🚀",
  });
});

// ✅ 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

module.exports = app;