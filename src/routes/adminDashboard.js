// 后台 dashboard 统计接口：给商家后台首页提供订单、收入、余额、厨师等汇总数据。

const express = require("express");
const Booking = require("../models/Booking");
const { requireAdminUser } = require("../middleware/adminAuth");

const router = express.Router();
const getMerchantConfig = require("../core/merchants/getMerchantConfig");
function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function moneyNumber(value) {
  return Number(value || 0);
}

router.get("/:merchantSlug", requireAdminUser, async (req, res) => {
  try {
    const { merchantSlug } = req.params;
    const user = req.adminUser;
    const isPlatformMode = merchantSlug === "__all__";

    const merchantConfig = isPlatformMode
      ? null
      : getMerchantConfig(merchantSlug);

    const canAccess =
      user?.role === "platform_admin" ||
      (user?.merchantSlugs || []).includes(merchantSlug);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    const startOfToday = getStartOfToday();

    const query = {
      isArchived: { $ne: true },
    };

    if (!isPlatformMode) {
      query.merchantSlug = merchantSlug;
    }

    const bookings = await Booking.find(query).lean();

    const todayOrders = bookings.filter((booking) => {
      const createdAt = booking.createdAt ? new Date(booking.createdAt) : null;
      return createdAt && createdAt >= startOfToday;
    }).length;

    const expectedRevenue = bookings.reduce((total, booking) => {
      const pricing = booking.pricingSnapshot || {};
      return total + moneyNumber(pricing.totalPrice || pricing.total);
    }, 0);

    const paidRevenue = bookings.reduce((total, booking) => {
      const pricing = booking.pricingSnapshot || {};
      const paymentStatus = booking.payment?.status;

      if (paymentStatus === "paid_full") {
        return total + moneyNumber(pricing.totalPrice || pricing.total);
      }

      if (paymentStatus === "deposit_paid") {
        return total + moneyNumber(pricing.deposit);
      }

      return total;
    }, 0);

    const outstandingBalance = Math.max(0, expectedRevenue - paidRevenue);

    const assignedChefs = new Set(
      bookings
        .map((booking) => booking.assignedChefEmail)
        .filter(Boolean),
    ).size;

return res.json({
  success: true,
  merchantSlug,
  merchant: isPlatformMode
    ? null
    : {
        integrations: {
          googleCalendar:
            merchantConfig?.integrations?.googleCalendar || {},
          googleSheets:
            merchantConfig?.integrations?.googleSheets || {},
        },
      },
  summary: {
    todayOrders,
    expectedRevenue,
    paidRevenue,
    outstandingBalance,
    assignedChefs,
    totalActiveOrders: bookings.length,
  },
});
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load dashboard summary.",
      details: error.message,
    });
  }
});

module.exports = router;