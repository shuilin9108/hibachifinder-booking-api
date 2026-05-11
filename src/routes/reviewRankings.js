import express from "express";
import Review from "../models/Review.js";

const router = express.Router();

router.get("/merchants", async (req, res) => {
  try {
    const reviews = await Review.aggregate([
      {
        $match: {
          status: "approved",
          reviewType: "merchant",
        },
      },
      {
        $group: {
          _id: "$merchantSlug",
          averageRating: {
            $avg: "$rating",
          },
          totalReviews: {
            $sum: 1,
          },
          verifiedReviews: {
            $sum: {
              $cond: ["$verified", 1, 0],
            },
          },
        },
      },
      {
        $addFields: {
          rankingScore: {
            $add: [
              { $multiply: ["$averageRating", 20] },
              "$totalReviews",
              { $multiply: ["$verifiedReviews", 2] },
            ],
          },
        },
      },
      {
        $sort: {
          rankingScore: -1,
        },
      },
    ]);

    res.json({
      success: true,
      rankings: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/chefs", async (req, res) => {
  try {
    const reviews = await Review.aggregate([
      {
        $match: {
          status: "approved",
          reviewType: "chef",
        },
      },
      {
        $group: {
          _id: "$chefId",
          averageRating: {
            $avg: "$rating",
          },
          totalReviews: {
            $sum: 1,
          },
          verifiedReviews: {
            $sum: {
              $cond: ["$verified", 1, 0],
            },
          },
        },
      },
      {
        $addFields: {
          rankingScore: {
            $add: [
              { $multiply: ["$averageRating", 20] },
              "$totalReviews",
              { $multiply: ["$verifiedReviews", 2] },
            ],
          },
        },
      },
      {
        $sort: {
          rankingScore: -1,
        },
      },
    ]);

    res.json({
      success: true,
      rankings: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
