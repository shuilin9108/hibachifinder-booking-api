const express = require("express");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer").default || require("../models/Customer");
const Booking = require("../models/Booking");
const Review = require("../models/Review").default || require("../models/Review");

const router = express.Router();

function getCustomerEmailFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (token) {
    const decoded = jwt.verify(
      token,
      process.env.CUSTOMER_JWT_SECRET || "dev-customer-secret-change-me",
    );

    return String(decoded.email || "").trim().toLowerCase();
  }

  return String(req.query.email || "").trim().toLowerCase();
}

router.get("/", async (req, res) => {
  try {
    const email = getCustomerEmailFromRequest(req);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Customer email or token is required.",
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
    res.status(401).json({ success: false, error: error.message });
  }
});

module.exports = router;
