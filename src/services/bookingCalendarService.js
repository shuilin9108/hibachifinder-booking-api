// 根据商家配置同步 booking 到 Google Calendar API。
// 现在不再使用 Google Apps Script webhook。
// .env 需要：
// GOOGLE_CLIENT_ID=
// GOOGLE_CLIENT_SECRET=
// GOOGLE_REFRESH_TOKEN=

const getMerchantConfig = require("../core/merchants/getMerchantConfig");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

const DEFAULT_TIMEZONE =
  process.env.GOOGLE_CALENDAR_TIMEZONE || "America/New_York";

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getMerchantFromBooking(booking) {
  return getMerchantConfig(booking?.merchantSlug || "kobe");
}

function getCalendarId(merchant) {
  return merchant?.integrations?.googleCalendar?.calendarId || "primary";
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

function parseEventDateTime(date, time) {
  if (!date) return null;

  const cleanTime = time || "12:00";
  const start = new Date(`${date}T${cleanTime}:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  if (Number.isNaN(start.getTime())) return null;

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function getGoogleAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth environment variables.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Google token refresh failed: ${data.error_description || data.error}`,
    );
  }

  return data.access_token;
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
  const assignedChefEmail = booking?.assignedChefEmail || "Not assigned";
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

  const addOns =
    Object.entries(selection?.addOns || {})
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([name, qty]) => `${name} x${qty}`)
      .join(", ") || "None";

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
  if (mode === "manual_sync") statusLabel = "SYNCED BOOKING";

  const merchantName =
    merchant?.branding?.businessName ||
    merchant?.business?.name ||
    booking?.merchantSlug ||
    "Booking";

  const title = `${statusLabel} - ${merchantName} - ${
    customer?.name || "Unknown"
  } - ${guestCount} guests`;

  const travelFeeText = getTravelFeeText(pricing);

  const location = [
    address?.street,
    address?.city,
    address?.state,
    address?.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

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
    `Address: ${location || ""}`,
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
    `Assigned Chef: ${assignedChefEmail}`,
    "",
    `Meal Decision: ${
      selection?.mealDecision === "now"
        ? "Protein selections were provided"
        : "Protein selections will be confirmed later by staff"
    }`,
    `Adult Proteins: ${adultProteins}`,
    `Kid Proteins: ${kidProteins}`,
    `Add-ons: ${addOns}`,
    "",
    `Allergies: ${allergies}`,
    `Special Requests: ${shared?.specialRequests || "None"}`,
    `Heard About: ${heardAbout}`,
    `Notes: ${booking?.notes || "None"}`,
  ];

  return {
    merchantSlug: booking?.merchantSlug || "",
    merchantName,
    calendarId: getCalendarId(merchant),
    bookingId: booking?.bookingId || "",
    mode,
    title,
    date: event?.date || "",
    time: event?.time || "",
    location,
    description: descriptionLines.join("\n"),
    assignedChefEmail: booking?.assignedChefEmail || "",
  };
}

function buildGoogleCalendarEvent(payload, options = {}) {
  const dateTime = parseEventDateTime(payload.date, payload.time);

  if (!dateTime) {
    throw new Error("Missing or invalid event date/time.");
  }

  const event = {
    summary: payload.title,
    location: payload.location || "",
    description: payload.description || "",
    start: {
      dateTime: dateTime.start,
      timeZone: DEFAULT_TIMEZONE,
    },
    end: {
      dateTime: dateTime.end,
      timeZone: DEFAULT_TIMEZONE,
    },
    extendedProperties: {
      private: {
        bookingId: payload.bookingId,
        merchantSlug: payload.merchantSlug,
        mode: payload.mode,
      },
    },
  };

  if (options.inviteAssignedChef && payload.assignedChefEmail) {
    event.attendees = [
      {
        email: payload.assignedChefEmail,
      },
    ];
  }

  return event;
}

function getExistingGoogleEventId(booking) {
  return (
    booking?.googleCalendarEventId ||
    booking?.calendarSync?.eventId ||
    booking?.calendarSync?.googleEventId ||
    booking?.calendarEventId ||
    booking?.calendar?.googleEventId ||
    booking?.calendar?.eventId ||
    ""
  );
}

async function upsertBookingCalendarEvent(booking, mode = "initial") {
  const merchant = getMerchantFromBooking(booking);
  const calendarConfig = merchant?.integrations?.googleCalendar || {};

  if (calendarConfig.enabled === false) {
    console.warn(
      `Google Calendar disabled for merchant: ${
        booking?.merchantSlug || "unknown"
      }`,
    );

    return {
      success: false,
      skipped: true,
      reason: "calendar_disabled",
    };
  }

  const accessToken = await getGoogleAccessToken();
  const payload = buildBookingCalendarPayload(booking, mode);
  const calendarId = encodeURIComponent(payload.calendarId || "primary");
  const googleEvent = buildGoogleCalendarEvent(payload, {
    inviteAssignedChef: mode === "invite_chef",
  });
  const existingEventId = getExistingGoogleEventId(booking);

  const baseUrl = existingEventId
    ? `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${encodeURIComponent(
        existingEventId,
      )}`
    : `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events`;

  const url = mode === "invite_chef" ? `${baseUrl}?sendUpdates=all` : baseUrl;

  const response = await fetch(url, {
    method: existingEventId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(googleEvent),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Google Calendar sync failed: ${data.error?.message || response.status}`,
    );
  }

  return {
    success: true,
    provider: "google_calendar",
    mode,
    calendarId: payload.calendarId || "primary",
    eventId: data.id,
    htmlLink: data.htmlLink,
    summary: data.summary,
  };
}

module.exports = {
  upsertBookingCalendarEvent,
};
