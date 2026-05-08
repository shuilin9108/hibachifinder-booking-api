// buildSheetRow.js 是用来把 booking 数据转换成 Google Sheets 单行数据格式的，方便 appendBookingToSheet 和 updateBookingRow 使用。

function safe(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function formatAddress(address = {}) {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
  ].filter(Boolean);

  return parts.join(", ");
}

function formatProteinMap(map = {}) {
  return Object.entries(map)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([name, qty]) => `${name} x${qty}`)
    .join(", ");
}

function formatAddOns(addOns = {}) {
  return Object.entries(addOns)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([name, qty]) => `${name} x${qty}`)
    .join(", ");
}

function buildSheetRow(booking = {}) {
  const customer = booking.customer || {};
  const event = booking.event || {};
  const address = event.address || {};
  const selection = booking.selection || {};
  const shared = booking.shared || {};
  const food = booking.food || {};
  const pricing = booking.pricingSnapshot || {};
  const payment = booking.payment || {};

  const adultProteins =
    selection.mealDecision === "now"
      ? formatProteinMap(selection.proteins?.adult || {})
      : "TBD";

  const kidProteins =
    selection.mealDecision === "now"
      ? formatProteinMap(selection.proteins?.kid || {})
      : "TBD";

  const addOns = formatAddOns(selection.addOns || {});

  return [
    safe(booking.bookingId),
    safe(booking.createdAt),

    safe(customer.firstName),
    safe(customer.lastName),
    safe(customer.phone),
    safe(customer.email),

    safe(event.date),
    safe(event.time),

    safe(event.adultCount),
    safe(event.kidCount),

    formatAddress(address),

    safe(event.travelMiles),

    safe(selection.packageId),
    safe(selection.mealDecision),

    adultProteins,
    kidProteins,
    addOns,

    safe(shared.promoCode),

    Array.isArray(shared.heardAbout)
      ? shared.heardAbout.join(", ")
      : "",

    Array.isArray(food.allergies)
      ? food.allergies.join(", ")
      : "",

    safe(shared.specialRequests),
    safe(booking.notes),

    safe(pricing.subtotalBeforeDiscount),
    safe(pricing.subtotal),
    safe(pricing.tax),
    safe(pricing.totalPrice),

    safe(pricing.deposit),

    safe(payment.status),

    safe(booking.status),

    safe(shared.birthday?.month),
    safe(shared.birthday?.day),
    safe(shared.birthday?.year),
  ];
}

module.exports = buildSheetRow;