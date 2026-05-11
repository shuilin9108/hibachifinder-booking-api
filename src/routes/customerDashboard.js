// Customer Dashboard API：根据客户 email 读取账号资料、订单历史、收藏、积分和礼品卡信息。

import express from "express";
import Customer from "../models/Customer.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required.",
      });
    }

    const customer = await Customer.findOne({ email });

    const bookings = await Booking.find({
      customerEmail: email,
    }).sort({ createdAt: -1 });

    const reviews = await Review.find({
      customerEmail: email,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      customer,
      summary: {
        upcomingBookings: bookings.filter((b) => b.status !== "completed").length,
        pastBookings: bookings.filter((b) => b.status === "completed").length,
        reviewCount: reviews.length,
        rewardPoints: customer?.rewardPoints || 0,
        giftCardBalance: customer?.giftCardBalance || 0,
      },
      bookings,
      reviews,
      favorites: {
        merchantSlugs: customer?.favoriteMerchantSlugs || [],
        chefIds: customer?.favoriteChefIds || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
