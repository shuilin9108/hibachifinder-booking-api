// Reviews API：读取商家/厨师评论，并允许提交新的 pending review。

import express from "express";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import { getReviewStats } from "../services/reviewStatsService.js";

const router = express.Router();

router.get("/merchant/:merchantSlug", async (req, res) => {
  try {
    const reviews = await Review.find({
      reviewType: "merchant",
      merchantSlug: req.params.merchantSlug,
      status: "approved",
    }).sort({ createdAt: -1 });

    const summary = await getReviewStats({
      reviewType: "merchant",
      merchantSlug: req.params.merchantSlug,
    });

    res.json({ success: true, reviews, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/chef/:chefId", async (req, res) => {
  try {
    const reviews = await Review.find({
      reviewType: "chef",
      chefId: req.params.chefId,
      status: "approved",
    }).sort({ createdAt: -1 });

    const summary = await getReviewStats({
      reviewType: "chef",
      chefId: req.params.chefId,
    });

    res.json({ success: true, reviews, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    let verified = false;
    let reviewSource = req.body.source || "guest_form";

    let merchantSlug = req.body.merchantSlug || null;
    let chefId = req.body.chefId || null;

    let customerName =
      req.body.customerName ||
      req.body.reviewerDisplayName ||
      "Guest Customer";

    let customerEmail = req.body.customerEmail || "";

    if (req.body.bookingId) {
      const booking = await Booking.findById(req.body.bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found.",
        });
      }

      if (booking.status !== "completed") {
        return res.status(400).json({
          success: false,
          error: "Only completed bookings can submit verified reviews.",
        });
      }

      verified = true;
      reviewSource = "verified_booking_flow";

      merchantSlug =
        merchantSlug ||
        booking.merchantSlug ||
        null;

      chefId =
        chefId ||
        booking.requestedChefId ||
        booking.assignedChefPlatformUserId ||
        null;

      customerName =
        booking.customerName ||
        customerName;

      customerEmail =
        booking.customerEmail ||
        customerEmail;
    }

    const review = await Review.create({
      reviewType: req.body.reviewType,
      merchantSlug,
      chefId,
      bookingId: req.body.bookingId || null,
      reviewerType: req.body.reviewerType || "guest",
      reviewerUserId: req.body.reviewerUserId || null,
      reviewerDisplayName: req.body.reviewerDisplayName || "",
      source: reviewSource,
      customerName,
      customerEmail,
      rating: Number(req.body.rating),
      title: req.body.title || "",
      comment: req.body.comment,
      eventType: req.body.eventType || "",
      city: req.body.city || "",
      verified,
      status: "pending",
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "This booking has already submitted a review for this target.",
      });
    }

    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
