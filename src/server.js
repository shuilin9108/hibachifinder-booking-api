// 只负责连接数据库并启动服务。
require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env" : ".env.local",
});

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Booking Engine API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();