// Admin Reviews API：后台查看、审核、隐藏客户提交的商家/厨师评论。

import express from "express";
import Review from "../models/Review.js";
import { requireAdminUser } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", requireAdminUser, async (req, res) => {
  try {
    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.reviewType) {
      query.reviewType = req.query.reviewType;
    }

    if (req.query.merchantSlug) {
      query.merchantSlug = req.query.merchantSlug;
    }

    if (req.query.chefId) {
      query.chefId = req.query.chefId;
    }

    const reviews = await Review.find(query).sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch("/:reviewId/status", requireAdminUser, async (req, res) => {
  try {
    const nextStatus = req.body.status;

    if (!["pending", "approved", "rejected", "hidden"].includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        error: "Invalid review status.",
      });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { status: nextStatus },
      { new: true },
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found.",
      });
    }

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
