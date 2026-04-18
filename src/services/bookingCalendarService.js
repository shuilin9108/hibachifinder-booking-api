const GOOGLE_CALENDAR_WEBHOOK_URL =
  process.env.GOOGLE_CALENDAR_WEBHOOK_URL || "";

function buildBookingCalendarPayload(booking, mode = "initial") {
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

  const title = `${statusLabel} - ${customer?.name || "Unknown"} - ${guestCount} guests`;

  const descriptionLines = [
    `Booking ID: ${booking?.bookingId || ""}`,
    `Status: ${booking?.status || "pending"}`,
    `Customer: ${customer?.name || ""}`,
    `Phone: ${customer?.phone || ""}`,
    `Email: ${customer?.email || ""}`,
    "",
    `Event Date: ${event?.date || ""}`,
    `Event Time: ${event?.time || ""}`,
    `Address: ${address?.street || ""}, ${address?.city || ""}, ${address?.state || ""} ${address?.zipCode || ""}`,
    `Guests: ${guestCount}`,
    `Adults: ${event?.adultCount || 0}`,
    `Kids: ${event?.kidCount || 0}`,
    "",
    `Package: ${pricing?.packageName || ""}`,
    `Travel Miles: ${pricing?.travelMiles || 0}`,
    `Travel Fee: $${Number(pricing?.travelFee || 0).toFixed(2)}`,
    `Subtotal Before Discount: $${Number(pricing?.subtotalBeforeDiscount || 0).toFixed(2)}`,
    `Tax: $${Number(pricing?.tax || 0).toFixed(2)}`,
    `Total Price: $${Number(pricing?.totalPrice || 0).toFixed(2)}`,
    `Deposit Amount: $${Number(pricing?.deposit || 0).toFixed(2)}`,
    `Deposit Status: ${payment?.depositStatus || "not_paid"}`,
    "",
    `Meal Decision: ${
      selection?.mealDecision === "now"
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
    bookingId: booking?.bookingId || "",
    mode,
    title,
    date: event?.date || "",
    time: event?.time || "",
    location: `${address?.street || ""}, ${address?.city || ""}, ${address?.state || ""} ${address?.zipCode || ""}`.trim(),
    description: descriptionLines.join("\n"),
  };
}

async function upsertBookingCalendarEvent(booking, mode = "initial") {
  if (!GOOGLE_CALENDAR_WEBHOOK_URL) {
    console.warn("GOOGLE_CALENDAR_WEBHOOK_URL is not configured.");
    return { skipped: true };
  }

  const payload = buildBookingCalendarPayload(booking, mode);

  const response = await fetch(GOOGLE_CALENDAR_WEBHOOK_URL, {
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