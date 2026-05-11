import express from "express";
import Review from "../models/Review.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { merchantSlug, chefId, reviewType } = req.query;

    const match = {
      status: "approved",
    };

    if (merchantSlug) {
      match.merchantSlug = merchantSlug;
    }

    if (chefId) {
      match.chefId = chefId;
    }

    if (reviewType) {
      match.reviewType = reviewType;
    }

    const reviews = await Review.find(match);

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? (
            reviews.reduce(
              (sum, review) => sum + Number(review.rating || 0),
              0,
            ) / totalReviews
          ).toFixed(1)
        : 0;

    const verifiedCount = reviews.filter(
      (review) => review.verified === true,
    ).length;

    res.json({
      success: true,
      summary: {
        averageRating: Number(averageRating),
        totalReviews,
        verifiedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
