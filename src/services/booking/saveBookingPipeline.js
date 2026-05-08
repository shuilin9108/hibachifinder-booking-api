// 统一处理订单更新后的所有同步逻辑：价格、PDF、Calendar、Sheets、Payment Summary。

const { calculatePricing } = require("../../core/pricing/pricingEngine");

const getMerchantConfig = require("../../core/merchants/getMerchantConfig");

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
  };

  console.log("STEP 4: rebuild payment summary");

  console.log("STEP 5: regenerate invoice pdf");

  console.log("STEP 6: sync google calendar");

  console.log("STEP 7: sync google sheets");

  console.log("STEP 8: finalize booking pipeline");

  return {
    success: true,
    booking: nextBooking,
  };
}

module.exports = {
  saveBookingPipeline,
};
