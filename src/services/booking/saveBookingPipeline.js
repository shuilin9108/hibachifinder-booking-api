
function normalizeManualDiscountInput(value = {}) {
  return {
    enabled: !!value.enabled || Number(value.value || 0) > 0,
    type: value.type === "percent" ? "percent" : "flat",
    value: Number(value.value || 0),
    reason: String(value.reason || "").trim(),
  };
}

// 统一处理订单更新后的所有同步逻辑：价格、PDF、Calendar、Sheets、Payment Summary。

const { calculatePricing } = require("../../core/pricing/pricingEngine");
const getMerchantConfig = require("../../core/merchants/getMerchantConfig");
const { upsertBookingCalendarEvent } = require("../bookingCalendarService");

async function saveBookingPipeline(options = {}) {
  const { booking, updatedEvent, updatedSelection, manualDiscount: manualDiscountInput } = options;

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

  const manualDiscount = normalizeManualDiscountInput(
    manualDiscountInput ||
      nextBooking.manualDiscount ||
      nextBooking.pricingSnapshot?.manualDiscountConfig ||
      {},
  );

  const formWithManualDiscount = {
    ...formForPricing,
    admin: {
      ...(formForPricing.admin || {}),
      manualDiscount,
    },
  };

  const recalculatedPricing = calculatePricing(formWithManualDiscount, merchant);

  const subtotalBeforeDiscount = Number(
    recalculatedPricing.subtotalBeforeDiscount || 0,
  );

  const manualDiscountAmount = manualDiscount.enabled
    ? manualDiscount.type === "percent"
      ? Math.round(
          subtotalBeforeDiscount *
            (Math.min(100, Math.max(0, Number(manualDiscount.value || 0))) /
              100),
        )
      : Math.min(
          subtotalBeforeDiscount,
          Math.max(0, Number(manualDiscount.value || 0)),
        )
    : 0;

  const promoAndBirthdayDiscount =
    Number(recalculatedPricing.promoCodeDiscount || 0) +
    Number(recalculatedPricing.birthdayDiscount || 0);

  const finalTotalDiscount = promoAndBirthdayDiscount + manualDiscountAmount;
  const finalSubtotal = Math.max(0, subtotalBeforeDiscount - finalTotalDiscount);
  const finalTax = Number(recalculatedPricing.tax || 0);
  const finalTotal = finalSubtotal + finalTax;

  nextBooking.pricingSnapshot = {
    ...(nextBooking.pricingSnapshot || {}),
    ...recalculatedPricing,
    manualDiscount: manualDiscountAmount,
    manualDiscountType: manualDiscount.type,
    manualDiscountValue: Number(manualDiscount.value || 0),
    manualDiscountReason: manualDiscount.reason || "",
    manualDiscountConfig: manualDiscount,
    totalDiscount: finalTotalDiscount,
    subtotal: finalSubtotal,
    totalPrice: finalTotal,
    total: finalTotal,
    tipRecommendationBase: subtotalBeforeDiscount,
    pricingBreakdown: {
      ...(recalculatedPricing.pricingBreakdown || {}),
      discounts: {
        ...(recalculatedPricing.pricingBreakdown?.discounts || {}),
        manualDiscount: manualDiscountAmount,
        total: finalTotalDiscount,
      },
      totals: {
        ...(recalculatedPricing.pricingBreakdown?.totals || {}),
        subtotalBeforeDiscount,
        subtotal: finalSubtotal,
        total: finalTotal,
      },
    },
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
