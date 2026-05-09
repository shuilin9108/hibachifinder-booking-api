// 负责把 booking 数据转换成 Google Sheet 的一行数据，顺序必须和 Sheet Header 完全一致。

function listToText(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.name) return item.name;
        if (item?.label) return item.label;
        if (item?.title) return item.title;
        return JSON.stringify(item);
      })
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function moneyValue(value) {
  if (value === undefined || value === null || value === "") return 0;
  return Number(value) || 0;
}

function formatNewYorkDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function bookingSheetMapper({ booking = {}, merchant = {}, pricing = {} }) {
  return [
    booking.bookingId || booking._id || "",

    formatNewYorkDateTime(booking.createdAt || new Date()),

    merchant.slug || booking.merchantSlug || booking.merchant || "",

    booking.status || "pending",

    booking.firstName || booking.customer?.firstName || "",
    booking.lastName || booking.customer?.lastName || "",
    booking.phone || booking.customer?.phone || "",
    booking.email || booking.customer?.email || "",

    booking.eventDate || booking.event?.date || "",
    booking.eventTime || booking.event?.time || "",

    booking.streetAddress || booking.event?.address?.street || booking.address?.street || "",
    booking.city || booking.event?.address?.city || booking.address?.city || "",
    booking.state || booking.event?.address?.state || booking.address?.state || "",
    booking.zipCode ||
      booking.event?.address?.zipCode ||
      booking.address?.zipCode ||
      booking.address?.zip ||
      "",

    booking.travelMiles || booking.event?.travelMiles || booking.travel?.miles || "",

    booking.packageId || booking.selection?.packageId || booking.package?.id || "",
    booking.packageName ||
      pricing.packageName ||
      booking.pricingSnapshot?.packageName ||
      booking.package?.name ||
      "",

    booking.mealDecision || booking.selection?.mealDecision || "",

    booking.adultCount || booking.event?.adultCount || booking.guests?.adults || 0,
    booking.kidCount || booking.event?.kidCount || booking.guests?.kids || 0,

    listToText(booking.adultProteins || booking.selection?.proteins?.adult || booking.proteins?.adults),
    listToText(booking.kidProteins || booking.selection?.proteins?.kid || booking.proteins?.kids),

    listToText(booking.addOns || booking.selection?.addOns),

    booking.promoCode || booking.shared?.promoCode || booking.promotion?.code || "",

    booking.birthdayGuest ? "YES" : "NO",
    booking.birthdayMonth || booking.shared?.birthday?.month || booking.birthday?.month || "",
    booking.birthdayDay || booking.shared?.birthday?.day || booking.birthday?.day || "",
    booking.birthdayYear || booking.shared?.birthday?.year || booking.birthday?.year || "",

    booking.heardAboutUs || listToText(booking.shared?.heardAbout) || booking.howHeardAboutUs || "",

    booking.allergies || listToText(booking.food?.allergies),
    booking.specialRequests || booking.shared?.specialRequests || "",
    booking.customerNotes || booking.notes || "",

    moneyValue(pricing.subtotal || pricing.subtotalBeforeDiscount || booking.pricing?.subtotal),
    moneyValue(pricing.discount || booking.pricing?.discount),
    moneyValue(pricing.travelFee || booking.pricing?.travelFee),
    moneyValue(pricing.tax || booking.pricing?.tax),
    moneyValue(pricing.grandTotal || pricing.total || pricing.totalPrice || booking.pricing?.grandTotal),

    moneyValue(pricing.depositAmount || pricing.depositDue || booking.pricing?.depositAmount),
    moneyValue(pricing.remainingBalance || pricing.balanceDue || booking.pricing?.remainingBalance),

    booking.stripePaymentStatus || booking.payment?.stripeStatus || booking.payment?.depositStatus || "unpaid",

    booking.depositPaid || booking.payment?.depositSelected || booking.payment?.depositStatus === "paid"
      ? "YES"
      : "NO",

    booking.googleCalendarEventId ||
      booking.calendarSync?.eventId ||
      booking.integrations?.googleCalendarEventId ||
      "",

    booking.internalNotes || "",
  ];
}

module.exports = {
  bookingSheetMapper,
};