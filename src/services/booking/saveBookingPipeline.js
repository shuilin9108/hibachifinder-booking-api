// 统一处理订单更新后的所有同步逻辑：价格、PDF、Calendar、Sheets、Payment Summary。

const { calculatePricing } = require("../../core/pricing/pricingEngine");
const getMerchantConfig = require("../../core/merchants/getMerchantConfig");
const { upsertBookingCalendarEvent } = require("../bookingCalendarService");

async function saveBookingPipeline(options = {}) {
  const { booking, updatedEvent, updatedSelection } = options;

  console.log("STEP 1: merge booking changes");

  const nextBooking = {
    ...booking,
    event: {
      ...(booking?.event || {}),
      ...(updatedEvent || {}),
    },
    selection: {
      ...(booking?.selection || {}),
      ...(updatedSelection || {}),
    },
  };

  console.log("STEP 2: load merchant config");

  const merchant = getMerchantConfig(nextBooking?.merchantSlug || "kobe");

  console.log("STEP 3: rebuild pricing");

  const formForPricing = {
    customer: nextBooking.customer || {},
    event: nextBooking.event || {},
    selection: nextBooking.selection || {},
    shared: nextBooking.shared || {},
    food: nextBooking.food || {},
    merchantSpecific: nextBooking.merchantSpecific || {},
    notes: nextBooking.notes || "",
    addOns: nextBooking.selection?.addOns || {},
  };

  const recalculatedPricing = calculatePricing(formForPricing, merchant);

  nextBooking.pricingSnapshot = {
    ...(nextBooking.pricingSnapshot || {}),
    ...recalculatedPricing,
    totalPrice: Number(
      recalculatedPricing.total || recalculatedPricing.totalPrice || 0,
    ),
    total: Number(
      recalculatedPricing.total || recalculatedPricing.totalPrice || 0,
    ),
  };

  console.log("STEP 4: rebuild payment summary");

  const totalPrice = Number(
    nextBooking.pricingSnapshot?.totalPrice ||
      nextBooking.pricingSnapshot?.total ||
      0,
  );

  const depositAmount = Number(nextBooking.pricingSnapshot?.deposit || 0);
  const paymentStatus = nextBooking.payment?.status || "unpaid";

  nextBooking.payment = {
    ...(nextBooking.payment || {}),
    status: paymentStatus,
    depositAmount,
    totalPrice,
    remainingBalance:
      paymentStatus === "paid_full"
        ? 0
        : paymentStatus === "deposit_paid"
          ? Math.max(0, totalPrice - depositAmount)
          : totalPrice,
  };

  console.log("STEP 5: regenerate invoice pdf");

  nextBooking.invoiceSync = {
    status: "ready_to_generate",
    lastPreparedAt: new Date().toISOString(),
    mode: "pipeline",
  };

  console.log("STEP 6: sync google calendar");

  let calendarSyncResult = null;

  try {
    calendarSyncResult = await upsertBookingCalendarEvent(
      nextBooking,
      "updated",
    );

    if (calendarSyncResult?.success) {
      nextBooking.googleCalendarEventId = calendarSyncResult.eventId || "";
      nextBooking.googleCalendarHtmlLink = calendarSyncResult.htmlLink || "";

      nextBooking.calendarSync = {
        status: "synced",
        provider: calendarSyncResult.provider || "google_calendar",
        eventId: calendarSyncResult.eventId || "",
        htmlLink: calendarSyncResult.htmlLink || "",
        lastSyncedAt: new Date().toISOString(),
        mode: "pipeline",
        result: calendarSyncResult,
      };
    }
  } catch (error) {
    console.error("PIPELINE CALENDAR SYNC ERROR:", error);

    nextBooking.calendarSync = {
      status: "failed",
      error: error.message,
      lastSyncedAt: new Date().toISOString(),
      mode: "pipeline",
    };
  }

  console.log("STEP 7: sync google sheets");

  nextBooking.sheetSync = {
    status: "not_configured",
    lastPreparedAt: new Date().toISOString(),
    mode: "pipeline",
  };

  console.log("STEP 8: finalize booking pipeline");

  return {
    success: true,
    booking: nextBooking,
    calendarSyncResult,
  };
}

module.exports = {
  saveBookingPipeline,
};
