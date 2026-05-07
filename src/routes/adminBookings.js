// 后台订单管理 API：用于查看订单、查看详情、更新状态、重发账单。

const express = require("express");
const router = express.Router();
const { calculatePricing } = require("../core/pricing/pricingEngine");
const getMerchantConfig = require("../core/merchants/getMerchantConfig");
const { requireAdminUser } = require("../middleware/adminAuth");
const { canAccessMerchant } = require("../data/adminUsers");
const { sendBookingEmails } = require("../services/bookingEmailService");
const Booking = require("../models/Booking");
const { upsertBookingCalendarEvent } = require("../services/bookingCalendarService");
function isPlatformAdmin(user) {
  return user?.role === "platform_admin";
}

router.get("/", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const query = {};

    if (isPlatformAdmin(user)) {
      // 全部订单
    } else if (user.role === "merchant_owner" || user.role === "merchant_staff") {
      query.merchantSlug = { $in: user.merchantSlugs || [] };
    } else if (user.role === "assigned_chef") {
      query.assignedChefEmail = user.email;
    } else {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(5000)
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

router.patch("/bulk/archive", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { bookingIds } = req.body;

    if (!isPlatformAdmin(user)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized",
      });
    }

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No booking IDs provided",
      });
    }

    const result = await Booking.updateMany(
      { bookingId: { $in: bookingIds } },
      {
        archived: true,
        archivedAt: new Date(),
        archivedBy: user.email,
        updatedAt: new Date().toISOString(),
      }
    );

    return res.json({
      success: true,
      message: "Bookings archived",
      count: result.modifiedCount || 0,
    });
  } catch (err) {
    console.error("BULK ARCHIVE ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Bulk archive failed",
    });
  }
});
router.patch("/:bookingId/assign-chef", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;

    const canAssignChef =
      isPlatformAdmin(user) ||
      user.role === "merchant_owner" ||
      user.role === "merchant_staff";

    if (!canAssignChef) {
      return res.status(403).json({
        success: false,
        error: "Not authorized",
      });
    }

    const { assignedChefEmail } = req.body;

    const booking = await Booking.findOne({
      bookingId: req.params.bookingId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    if (!isPlatformAdmin(user) && !canAccessMerchant(user, booking.merchantSlug)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

booking.assignedChefEmail = assignedChefEmail;
booking.updatedAt = new Date().toISOString();

await booking.save();

try {
  const calendarResult = await upsertBookingCalendarEvent(
    booking.toObject(),
    assignedChefEmail ? "invite_chef" : "updated",
  );

  if (calendarResult?.success && calendarResult?.eventId) {
    booking.googleCalendarEventId = calendarResult.eventId;
    booking.googleCalendarHtmlLink = calendarResult.htmlLink || "";

    booking.calendarSync = {
      status: "synced",
      provider: calendarResult.provider || "google_calendar",
      eventId: calendarResult.eventId,
      htmlLink: calendarResult.htmlLink || "",
      lastSyncedAt: new Date().toISOString(),
      lastSyncedBy: user.email,
      mode: "assign_chef",
      result: calendarResult,
    };

    await booking.save();
  }
} catch (calendarError) {
  console.error("ASSIGN CHEF CALENDAR SYNC ERROR:", calendarError);
}

return res.json({
  success: true,
  booking,
});
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Assign chef failed",
    });
  }
});

router.delete("/bulk/delete", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { bookingIds } = req.body;

    if (!isPlatformAdmin(user)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized",
      });
    }

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No booking IDs provided",
      });
    }

    const result = await Booking.deleteMany({
      bookingId: { $in: bookingIds },
    });

    return res.json({
      success: true,
      message: "Bookings deleted",
      count: result.deletedCount || 0,
    });
  } catch (err) {
    console.error("BULK DELETE ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Bulk delete failed",
    });
  }
});
router.post("/:bookingId/calendar-sync", requireAdminUser, async (req, res) => {
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

const calendarResult = await upsertBookingCalendarEvent(
  booking,
  "manual_sync"
);

if (calendarResult?.success && calendarResult?.eventId) {
  bookingDoc.googleCalendarEventId = calendarResult.eventId;
  bookingDoc.googleCalendarHtmlLink = calendarResult.htmlLink || "";
}

bookingDoc.calendarSync = {
  status: calendarResult?.skipped ? "skipped" : "synced",
  provider: calendarResult?.provider || "google_calendar",
  eventId: calendarResult?.eventId || bookingDoc.googleCalendarEventId || "",
  htmlLink:
    calendarResult?.htmlLink || bookingDoc.googleCalendarHtmlLink || "",
  reason: calendarResult?.reason || "",
  lastSyncedAt: new Date().toISOString(),
  lastSyncedBy: user.email,
  result: calendarResult,
};

    bookingDoc.updatedAt = new Date().toISOString();

    await bookingDoc.save();

    return res.json({
      success: true,
      message: calendarResult?.skipped
        ? `Calendar sync skipped: ${calendarResult.reason}`
        : "Calendar synced successfully.",
      calendarResult,
      booking: bookingDoc.toObject(),
    });
  } catch (err) {
    console.error("ADMIN CALENDAR SYNC ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Calendar sync failed",
      details: err.message,
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
  user,
  booking: {
    ...booking,
    merchantConfig: getMerchantConfig(booking.merchantSlug),
  },
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

// 更新订单 event，并重新计算价格
router.patch("/:bookingId/event", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { event } = req.body;

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

    const adultCount = Number(event?.adultCount || 0);
    const kidCount = Number(event?.kidCount || 0);

bookingDoc.event = {
  ...(bookingDoc.event || {}),
  ...(event || {}),
};

if (req.body.selection) {
  bookingDoc.selection = {
    ...(bookingDoc.selection || {}),
    ...(req.body.selection || {}),
  };
}

    const merchant = getMerchantConfig(bookingDoc.merchantSlug);

    const formForPricing = {
      customer: bookingDoc.customer || {},
      event: bookingDoc.event || {},
      selection: bookingDoc.selection || {},
      shared: bookingDoc.shared || {},
      food: bookingDoc.food || {},
      merchantSpecific: bookingDoc.merchantSpecific || {},
      notes: bookingDoc.notes || "",
      addOns: bookingDoc.selection?.addOns || {},
    };

    const recalculatedPricing = calculatePricing(formForPricing, merchant);

    bookingDoc.pricingSnapshot = {
      ...(bookingDoc.pricingSnapshot || {}),
      ...recalculatedPricing,
      totalPrice: Number(
        recalculatedPricing.total || recalculatedPricing.totalPrice || 0
      ),
      total: Number(
        recalculatedPricing.total || recalculatedPricing.totalPrice || 0
      ),
    };

    bookingDoc.updatedAt = new Date().toISOString();

    await bookingDoc.save();

    return res.status(200).json({
      success: true,
      message: "Event updated and pricing recalculated.",
      booking: bookingDoc.toObject(),
    });
  } catch (error) {
    console.error("UPDATE EVENT ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to update event",
      details: error.message,
    });
  }
});

// 更新 proteins / add-ons，并重新计算价格
router.patch("/:bookingId/selection", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { selection } = req.body;

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

    bookingDoc.selection = {
      ...(bookingDoc.selection || {}),
      ...(selection || {}),
      proteins: {
        adult: selection?.proteins?.adult || {},
        kid: selection?.proteins?.kid || {},
      },
      addOns: selection?.addOns || {},
    };

    const merchant = getMerchantConfig(bookingDoc.merchantSlug);

    const formForPricing = {
      customer: bookingDoc.customer || {},
      event: bookingDoc.event || {},
      selection: bookingDoc.selection || {},
      shared: bookingDoc.shared || {},
      food: bookingDoc.food || {},
      merchantSpecific: bookingDoc.merchantSpecific || {},
      notes: bookingDoc.notes || "",
      addOns: bookingDoc.selection?.addOns || {},
    };

    const recalculatedPricing = calculatePricing(formForPricing, merchant);

    bookingDoc.pricingSnapshot = {
      ...(bookingDoc.pricingSnapshot || {}),
      ...recalculatedPricing,
      totalPrice: Number(
        recalculatedPricing.total || recalculatedPricing.totalPrice || 0
      ),
      total: Number(
        recalculatedPricing.total || recalculatedPricing.totalPrice || 0
      ),
    };

    bookingDoc.updatedAt = new Date().toISOString();

    await bookingDoc.save();

    return res.status(200).json({
      success: true,
      message: "Selections updated and pricing recalculated.",
      booking: bookingDoc.toObject(),
    });
  } catch (error) {
    console.error("UPDATE SELECTION ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to update selections",
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

if (!isPlatformAdmin(user) && !canAccessMerchant(user, booking.merchantSlug)) {
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

router.patch("/:bookingId/archive", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { bookingId } = req.params;

    if (!isPlatformAdmin(user)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized",
      });
    }

    const booking = await Booking.findOneAndUpdate(
      { bookingId },
      {
        archived: true,
        archivedAt: new Date(),
        archivedBy: user.email,
        updatedAt: new Date().toISOString(),
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }



    return res.json({
      success: true,
      booking,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Archive failed",
    });
  }
});

router.delete("/:bookingId", requireAdminUser, async (req, res) => {
  try {
    const user = req.adminUser;
    const { bookingId } = req.params;

    if (!isPlatformAdmin(user)) {
      return res.status(403).json({
        success: false,
        error: "Not authorized",
      });
    }

    const booking = await Booking.findOneAndDelete({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    return res.json({
      success: true,
      message: "Booking deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Delete failed",
    });
  }
});

module.exports = router;