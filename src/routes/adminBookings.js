// 后台订单管理 API：用于查看订单、查看详情、更新状态、重发账单。

const express = require("express");
const router = express.Router();

const { requireAdminUser } = require("../middleware/adminAuth");
const { canAccessMerchant } = require("../data/adminUsers");
const { sendBookingEmails } = require("../services/bookingEmailService");
const Booking = require("../models/Booking");

router.get("/", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const query = {};

    if (user.role !== "admin") {
      query.merchantSlug = { $in: user.merchantSlugs };
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      user,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("ADMIN GET BOOKINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load bookings",
      details: error.message,
    });
  }
});

router.get("/:bookingId", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;

    const bookingDoc = await Booking.findOne({
      bookingId: req.params.bookingId,
    });

    if (!bookingDoc) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    const booking = bookingDoc.toObject();

    if (!canAccessMerchant(user, booking.merchantSlug)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("ADMIN GET BOOKING ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load booking",
      details: error.message,
    });
  }
});

// 更新订单状态
router.patch("/:bookingId/status", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid booking status",
      });
    }

    const bookingDoc = await Booking.findOne({
      bookingId: req.params.bookingId,
    });

    if (!bookingDoc) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    if (!canAccessMerchant(user, bookingDoc.merchantSlug)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    bookingDoc.status = status;
    bookingDoc.updatedAt = new Date().toISOString();

    await bookingDoc.save();

    return res.status(200).json({
      success: true,
      booking: bookingDoc.toObject(),
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to update status",
      details: error.message,
    });
  }
});
// 更新付款状态
router.patch("/:bookingId/payment-status", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { paymentStatus } = req.body;

    const allowedPaymentStatuses = [
      "unpaid",
      "deposit_paid",
      "paid_full",
    ];

    if (!allowedPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment status",
      });
    }

    const bookingDoc = await Booking.findOne({
      bookingId: req.params.bookingId,
    });

    if (!bookingDoc) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    if (!canAccessMerchant(user, bookingDoc.merchantSlug)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    bookingDoc.payment = {
      ...(bookingDoc.payment || {}),
      status: paymentStatus,
      depositStatus:
        paymentStatus === "deposit_paid" || paymentStatus === "paid_full"
          ? "paid"
          : "unpaid",
      paidFullAt:
        paymentStatus === "paid_full"
          ? new Date().toISOString()
          : bookingDoc.payment?.paidFullAt,
      depositPaidAt:
        paymentStatus === "deposit_paid" || paymentStatus === "paid_full"
          ? bookingDoc.payment?.depositPaidAt || new Date().toISOString()
          : bookingDoc.payment?.depositPaidAt,
    };

    bookingDoc.updatedAt = new Date().toISOString();

    await bookingDoc.save();

    return res.status(200).json({
      success: true,
      booking: bookingDoc.toObject(),
    });
  } catch (error) {
    console.error("UPDATE PAYMENT STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to update payment status",
      details: error.message,
    });
  }
});

router.post("/:bookingId/resend", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;

    const bookingDoc = await Booking.findOne({
      bookingId: req.params.bookingId,
    });

    if (!bookingDoc) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    const booking = bookingDoc.toObject();

    if (!canAccessMerchant(user, booking.merchantSlug)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    await sendBookingEmails({
      booking,
      mode: "resend",
    });

    return res.status(200).json({
      success: true,
      message: "Invoice resent",
    });
  } catch (error) {
    console.error("RESEND ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to resend email",
      details: error.message,
    });
  }
});

module.exports = router;