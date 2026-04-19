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
      "http://localhost:5174",
      "http://localhost:5713",
      "https://booking-engine-web-kv8t.vercel.app", // ⭐ 加这个
      // 👉 这里以后可以加你正式前端域名
      // "https://shuilink.com"
    ],
    credentials: true,
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