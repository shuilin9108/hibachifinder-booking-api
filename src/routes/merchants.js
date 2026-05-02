// 提供商家配置 API，让前端根据 merchantSlug 获取对应商家信息。

const express = require("express");

const getMerchantConfig = require("../core/merchants/getMerchantConfig");

const router = express.Router();

router.get("/:slug", (req, res) => {
  try {
    const { slug } = req.params;

    const merchant = getMerchantConfig(slug);

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
    });
  }
});

module.exports = router;