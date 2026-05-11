// Review Stats Service：根据 approved reviews 实时计算 merchant / chef 的平均评分和评论数量。

import Review from "../models/Review.js";

export async function getReviewStats({ reviewType, merchantSlug, chefId }) {
  const match = {
    reviewType,
    status: "approved",
  };

  if (merchantSlug) {
    match.merchantSlug = merchantSlug;
  }

  if (chefId) {
    match.chefId = chefId;
  }

  const [stats] = await Review.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
        verifiedCount: {
          $sum: {
            $cond: ["$verified", 1, 0],
          },
        },
      },
    },
  ]);

  return {
    averageRating: stats?.averageRating
      ? Number(stats.averageRating.toFixed(1))
      : 0,
    reviewCount: stats?.reviewCount || 0,
    verifiedCount: stats?.verifiedCount || 0,
  };
}
