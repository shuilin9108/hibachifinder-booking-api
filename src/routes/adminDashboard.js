// 后台 dashboard 统计接口：给商家后台首页提供订单、收入、余额、厨师等汇总数据。

const express = require("express");
const Booking = require("../models/Booking");

const router = express.Router();

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function moneyNumber(value) {
  return Number(value || 0);
}

router.get("/:merchantSlug", async (req, res) => {
  try {
    const { merchantSlug } = req.params;
    const { adminEmail } = req.query;

    if (!adminEmail) {
      return res.status(401).json({
        success: false,
        error: "Admin email is required.",
      });
    }

    const startOfToday = getStartOfToday();

    const bookings = await Booking.find({
      merchantSlug,
      isArchived: { $ne: true },
    }).lean();

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