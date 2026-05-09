// 提供商家配置 API，让前端根据 merchantSlug 获取默认配置 + MongoDB 后台设置后的最终商家信息。

const express = require("express");

const { getMergedMerchantConfig } = require("../services/merchantService");

const router = express.Router();

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const merchant = await getMergedMerchantConfig(slug);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: `Merchant "${slug}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      merchant,
    });
  } catch (error) {
    console.error("MERCHANT CONFIG ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load merchant config.",
      details: error.message,
    });
  }
});

module.exports = router;