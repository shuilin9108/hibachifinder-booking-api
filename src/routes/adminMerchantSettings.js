// 后台商家设置 API：让商家 owner/staff 或 platform admin 查看和更新商家配置。

const express = require("express");
const { requireAdminUser } = require("../middleware/adminAuth");
const { canAccessMerchant } = require("../data/adminUsers");
const {
  getMerchantSettings,
  getMergedMerchantConfig,
  upsertMerchantSettings,
} = require("../services/merchantService");

const router = express.Router();

function isPlatformAdmin(user) {
  return user?.role === "platform_admin";
}

function canManageMerchant(user, merchantSlug) {
  return (
    isPlatformAdmin(user) ||
    user?.role === "merchant_owner" ||
    user?.role === "merchant_staff"
  ) && canAccessMerchant(user, merchantSlug);
}

router.get("/:merchantSlug", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { merchantSlug } = req.params;

    if (!canManageMerchant(user, merchantSlug)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    const settings = await getMerchantSettings(merchantSlug);
    const merchant = await getMergedMerchantConfig(merchantSlug);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: "Merchant not found",
      });
    }

    return res.status(200).json({
      success: true,
      merchantSlug,
      settings,
      merchant,
    });
  } catch (error) {
    console.error("GET ADMIN MERCHANT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load merchant settings",
      details: error.message,
    });
  }
});

router.patch("/:merchantSlug", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { merchantSlug } = req.params;

    if (!canManageMerchant(user, merchantSlug)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    const result = await upsertMerchantSettings({
      slug: merchantSlug,
      updates: req.body || {},
      updatedBy: user.email,
    });

    return res.status(200).json({
      success: true,
      message: "Merchant settings updated successfully.",
      ...result,
    });
  } catch (error) {
    console.error("UPDATE ADMIN MERCHANT SETTINGS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: "Failed to update merchant settings",
      details: error.message,
    });
  }
});

module.exports = router;