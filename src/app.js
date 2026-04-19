require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health");
const merchantsRouter = require("./routes/merchants");
const bookingsRouter = require("./routes/bookings");

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://www.kobehibachicatering.com",
      "https://kobehibachicatering.com",
      "https://booking-engine-web-kv8t.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);

app.use(express.json());

console.log("🔥 APP USING ROUTES");

app.use("/api/health", healthRouter);
app.use("/api/merchants", merchantsRouter);
app.use("/api/bookings", bookingsRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Booking Engine API Running 🚀",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

module.exports = app;