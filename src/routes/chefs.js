// Chefs API：读取平台厨师列表、单个厨师 Profile，以及按商家读取厨师团队。

import express from "express";
import Chef from "../models/Chef.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = {};

    if (req.query.merchantSlug) {
      query.merchantSlug = req.query.merchantSlug;
    }

    if (req.query.independent === "true") {
      query.independent = true;
    }

    query.status = "active";
    query.profileVisibility = "public";

    const chefs = await Chef.find(query).sort({
      ratingAverage: -1,
      reviewCount: -1,
      orderCount: -1,
    });

    res.json({ success: true, chefs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:chefId", async (req, res) => {
  try {
    const chef = await Chef.findOne({
      chefId: req.params.chefId,
      status: "active",
      profileVisibility: "public",
    });

    if (!chef) {
      return res.status(404).json({
        success: false,
        error: "Chef not found.",
      });
    }

    res.json({ success: true, chef });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
