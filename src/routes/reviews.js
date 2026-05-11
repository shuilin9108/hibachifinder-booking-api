// Reviews API：读取商家/厨师评论，并允许提交新的 pending review。

import express from "express";
import Review from "../models/Review.js";
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
    const review = await Review.create({
      reviewType: req.body.reviewType,
      merchantSlug: req.body.merchantSlug || null,
      chefId: req.body.chefId || null,
      bookingId: req.body.bookingId || null,
      reviewerType: req.body.reviewerType || "guest",
      reviewerUserId: req.body.reviewerUserId || null,
      reviewerDisplayName: req.body.reviewerDisplayName || "",
      source: req.body.bookingId
        ? "verified_booking_flow"
        : req.body.source || "guest_form",
      customerName: req.body.customerName || req.body.reviewerDisplayName || "Guest Customer",
      customerEmail: req.body.customerEmail || "",
      rating: Number(req.body.rating),
      title: req.body.title || "",
      comment: req.body.comment,
      eventType: req.body.eventType || "",
      city: req.body.city || "",
      verified: Boolean(req.body.bookingId),
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
