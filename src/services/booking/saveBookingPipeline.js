// 统一处理后台 Save All 的 booking 更新、价格重算、PDF、Calendar、Sheets 同步。

const {
  calculatePricing,
} = require("../../core/pricing/pricingEngine");

const getMerchantConfig = require("../../core/merchants/getMerchantConfig");

async function saveBookingPipeline(options = {}) {
  const {
    booking,
    updatedEvent,
    updatedSelection,
  } = options;

  console.log("saveBookingPipeline started");

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

  const merchant = getMerchantConfig(
    nextBooking?.merchantSlug || "kobe",
  );

  const formForPricing = {
    event: nextBooking.event,
    selection: nextBooking.selection,
    shared: nextBooking.shared || {},
    food: nextBooking.food || {},
  };

  const recalculatedPricing = calculatePricing(
    formForPricing,
    merchant,
  );

  nextBooking.pricingSnapshot = {
    ...(nextBooking.pricingSnapshot || {}),
    ...recalculatedPricing,
  };

  return {
    success: true,
    booking: nextBooking,
  };
}

module.exports = {
  saveBookingPipeline,
};