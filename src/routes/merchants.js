// 提供商家配置 API，让前端根据 merchantSlug 获取默认配置 + MongoDB 后台设置后的最终商家信息。

const express = require("express");

const { getMergedMerchantConfig } = require("../services/merchantService");
const { getAllMerchantSlugs } = require("../core/merchants/getMerchantConfig");

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const slugs = getAllMerchantSlugs();

    const merchants = (
      await Promise.all(
        slugs.map(async (slug) => {
          const merchant = await getMergedMerchantConfig(slug);

          if (!merchant) return null;

          return {
            slug,
            name:
              merchant.business?.name ||
              merchant.branding?.businessName ||
              merchant.name ||
              slug,
            logo:
              merchant.business?.logoUrl ||
              merchant.branding?.logoUrl ||
              merchant.logo ||
              "",
            website: merchant.business?.website || merchant.website || "",
            phone: merchant.business?.phone || merchant.phone || "",
            email: merchant.business?.email || merchant.email || "",
            location:
              merchant.business?.homeBaseLabel ||
              merchant.location ||
              merchant.serviceAreaLabel ||
              "",
            serviceAreas: merchant.serviceAreas || [],
            startingPrice:
              merchant.startingPrice ||
              merchant.pricing?.startingPriceLabel ||
              "",
            description:
              merchant.description ||
              merchant.marketplaceDescription ||
              "",
            tags: merchant.tags || merchant.marketplaceTags || [],
            sponsored: Boolean(merchant.sponsored),
            bookingRoute: `/${slug}`,
            settings: merchant.settings || {},
          };
        }),
      )
    ).filter(Boolean);

    res.json({
      success: true,
      merchants,
    });
  } catch (error) {
    console.error("MERCHANT LIST ERROR:", error);

    res.status(500).json({
      success: false,
      error: "Failed to load merchants.",
      details: error.message,
    });
  }
});

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