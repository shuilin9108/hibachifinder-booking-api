const app = require("../src/app");
const connectDB = require("../src/config/db");

let isConnected = false;

module.exports = async (req, res) => {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
      console.log("✅ MongoDB connected in Vercel function");
    }

    return app(req, res);
  } catch (error) {
    console.error("❌ VERCEL API INIT ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Server failed to initialize",
      details: error.message,
    });
  }
};