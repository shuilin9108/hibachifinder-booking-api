// 根据商家配置同步 booking 到对应 Google Calendar。
/*
以后每个商家 calendar 就在对应 config 改：
integrations: {
  googleCalendar: {
    enabled: true,
    calendarId: "这个商家的 calendar id",
    webhookUrl: "这个商家的 calendar webhook",
  },
},
*/

const getMerchantConfig = require("../core/merchants/getMerchantConfig");

const DEFAULT_GOOGLE_CALENDAR_WEBHOOK_URL =
  process.env.GOOGLE_CALENDAR_WEBHOOK_URL || "";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getMerchantFromBooking(booking) {
  return getMerchantConfig(booking?.merchantSlug || "kobe");
}

function getCalendarWebhookUrl(merchant) {
  return (
    merchant?.integrations?.googleCalendar?.webhookUrl ||
    DEFAULT_GOOGLE_CALENDAR_WEBHOOK_URL
  );
}

function getTravelFeeText(pricing) {
  if (
    pricing?.travelFeeStatus === "manual_review_required" ||
    pricing?.travelFeeModel === "custom_quote" ||
    pricing?.travelFeeModel === "manual_only"
  ) {
    return (
      pricing?.travelFeeLabel ||
      "Travel fee may apply and will be confirmed by staff."
    );
  }

  return money(pricing?.travelFee || 0);
}

function buildBookingCalendarPayload(booking, mode = "initial") {
  const merchant = getMerchantFromBooking(booking);

  const customer = booking?.customer || {};
  const event = booking?.event || {};
  const address = event?.address || {};
  const selection = booking?.selection || {};
  const pricing = booking?.pricingSnapshot || {};
  const food = booking?.food || {};
  const shared = booking?.shared || {};
  const payment = booking?.payment || {};

  const adultProteins =
    selection?.mealDecision === "now"
      ? Object.entries(selection?.proteins?.adult || {})
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([name, qty]) => `${name} x${qty}`)
        .join(", ") || "None"
      : "TBD";

  const kidProteins =
    selection?.mealDecision === "now"
      ? Object.entries(selection?.proteins?.kid || {})
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([name, qty]) => `${name} x${qty}`)
        .join(", ") || "None"
      : "TBD";

  const allergies =
    Array.isArray(food?.allergies) && food.allergies.length > 0
      ? food.allergies.join(", ")
      : "None";

  const heardAbout =
    Array.isArray(shared?.heardAbout) && shared.heardAbout.length > 0
      ? shared.heardAbout.join(", ")
      : "Not provided";

  const guestCount = Number(event?.guestCount || 0);

  let statusLabel = "NEW BOOKING";
  if (mode === "updated") statusLabel = "UPDATED BOOKING";
  if (mode === "deposit_paid") statusLabel = "DEPOSIT PAID";

  const merchantName =
    merchant?.branding?.businessName ||
    merchant?.business?.name ||
    booking?.merchantSlug ||
    "Booking";
  const title = `${statusLabel} - ${merchantName} - ${customer?.name || "Unknown"
    } - ${guestCount} guests`;

  const travelFeeText = getTravelFeeText(pricing);

  const descriptionLines = [
    `Merchant: ${merchantName}`,
    `Merchant Slug: ${booking?.merchantSlug || ""}`,
    `Booking ID: ${booking?.bookingId || ""}`,
    `Status: ${booking?.status || "pending"}`,
    "",
    `Customer: ${customer?.name || ""}`,
    `Phone: ${customer?.phone || ""}`,
    `Email: ${customer?.email || ""}`,
    "",
    `Event Date: ${event?.date || ""}`,
    `Event Time: ${event?.time || ""}`,
    `Address: ${address?.street || ""}, ${address?.city || ""}, ${address?.state || ""
    } ${address?.zipCode || ""}`,
    `Guests: ${guestCount}`,
    `Adults: ${event?.adultCount || 0}`,
    `Kids: ${event?.kidCount || 0}`,
    "",
    `Package: ${pricing?.packageName || ""}`,
    `Travel Miles: ${pricing?.travelMiles || 0}`,
    `Travel Fee: ${travelFeeText}`,
    `Subtotal Before Discount: ${money(pricing?.subtotalBeforeDiscount || 0)}`,
    `Tax: ${money(pricing?.tax || 0)}`,
    `Total Price: ${money(pricing?.totalPrice || pricing?.total || 0)}`,
    `Deposit Amount: ${money(pricing?.deposit || 0)}`,
    `Deposit Status: ${payment?.depositStatus || "not_paid"}`,
    "",
    `Meal Decision: ${selection?.mealDecision === "now"
      ? "Protein selections were provided"
      : "Protein selections will be confirmed later by staff"
    }`,
    `Adult Proteins: ${adultProteins}`,
    `Kid Proteins: ${kidProteins}`,
    "",
    `Allergies: ${allergies}`,
    `Special Requests: ${shared?.specialRequests || "None"}`,
    `Heard About: ${heardAbout}`,
    `Notes: ${booking?.notes || "None"}`,
  ];

  return {
    merchantSlug: booking?.merchantSlug || "",
    merchantName,
    calendarId: merchant?.integrations?.googleCalendar?.calendarId || "",
    bookingId: booking?.bookingId || "",
    mode,
    title,
    date: event?.date || "",
    time: event?.time || "",
    location: `${address?.street || ""}, ${address?.city || ""}, ${address?.state || ""
      } ${address?.zipCode || ""}`.trim(),
    description: descriptionLines.join("\n"),
  };
}

async function upsertBookingCalendarEvent(booking, mode = "initial") {
  const merchant = getMerchantFromBooking(booking);
  const calendarConfig = merchant?.integrations?.googleCalendar || {};

  if (calendarConfig.enabled === false) {
    console.warn(
      `Google Calendar disabled for merchant: ${booking?.merchantSlug || "unknown"}`
    );
    return { skipped: true, reason: "calendar_disabled" };
  }

  const webhookUrl = getCalendarWebhookUrl(merchant);

  if (!webhookUrl) {
    console.warn("Google Calendar webhook URL is not configured.");
    return { skipped: true, reason: "missing_calendar_webhook" };
  }

  const payload = buildBookingCalendarPayload(booking, mode);

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Calendar webhook failed: ${response.status} ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { success: true, raw: text };
  }
}

module.exports = {
  upsertBookingCalendarEvent,
};