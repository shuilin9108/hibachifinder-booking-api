// 处理 booking 创建、查询、更新，以及根据 merchantSlug 使用对应商家规则。

const express = require("express");
const { sendBookingEmails } = require("../services/bookingEmailService");
const { upsertBookingCalendarEvent } = require("../services/bookingCalendarService");
const { calculatePricing } = require("../core/pricing/pricingEngine");
const getMerchantConfig = require("../core/merchants/getMerchantConfig");
const Booking = require("../models/Booking");
const { appendBookingRow } = require("../integrations/sheets/appendBookingRow");
const { bookingSheetMapper } = require("../core/bookings/bookingSheetMapper");
console.log("🔥 NEW BOOKING ROUTE LOADED");

const router = express.Router();
const bookingStore = new Map();

function getPayloadMerchant(payload) {
  const merchantSlug = payload?.merchantSlug || "kobe";
  const merchant = getMerchantConfig(merchantSlug);

  return {
    merchantSlug,
    merchant,
  };
}

function validateBookingPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Missing booking payload.";
  }

  const { merchantSlug, merchant } = getPayloadMerchant(payload);

  if (!merchant) {
    return `Invalid merchant slug: ${merchantSlug}.`;
  }

  const customer = payload.customer || {};
  const event = payload.event || {};
  const address = event.address || {};
  const selection = payload.selection || {};

  if (!String(customer.firstName || "").trim()) {
    return "Customer first name is required.";
  }

  if (!String(customer.lastName || "").trim()) {
    return "Customer last name is required.";
  }

  if (!String(customer.phone || "").trim()) {
    return "Customer phone is required.";
  }

  if (!String(customer.email || "").trim()) {
    return "Customer email is required.";
  }

  if (!String(event.date || "").trim()) {
    return "Event date is required.";
  }

  if (!String(event.time || "").trim()) {
    return "Event time is required.";
  }

  if (!String(address.street || "").trim()) {
    return "Street address is required.";
  }

  if (!String(address.city || "").trim()) {
    return "City is required.";
  }

  if (!String(address.state || "").trim()) {
    return "State is required.";
  }

  if (!String(address.zipCode || "").trim()) {
    return "ZIP code is required.";
  }

  if (Number(event.guestCount || 0) <= 0) {
    return "Guest count must be greater than 0.";
  }

  if (!String(selection.packageId || "").trim()) {
    return "Package selection is required.";
  }

  const minimumOrderTotal = Number(merchant?.booking?.minimumOrderTotal || 0);
  const subtotalBeforeDiscount = Number(
    payload?.pricingSnapshot?.subtotalBeforeDiscount ||
    payload?.pricingSnapshot?.totalPrice ||
    0
  );

  if (minimumOrderTotal > 0 && subtotalBeforeDiscount < minimumOrderTotal) {
    return `Minimum booking subtotal for ${merchant.business?.name || merchantSlug} is $${minimumOrderTotal}.`;
  }

  return "";
}

function normalizeProteinName(name) {
  const raw = String(name || "").trim().toLowerCase();

  const map = {
    beef: "steak",
    steak: "steak",
    chicken: "chicken",
    shrimp: "shrimp",
    salmon: "salmon",
    tofu: "tofu",
    scallop: "scallops",
    scallops: "scallops",
    filet: "filet-mignon",
    "filet mignon": "filet-mignon",
    "filet-mignon": "filet-mignon",
    lobster: "lobster-tail",
    "lobster tail": "lobster-tail",
    "lobster-tail": "lobster-tail",
  };

  return map[raw] || raw.replace(/\s+/g, "-");
}

function parseProteinText(text) {
  const result = {};
  const raw = String(text || "").trim();

  if (!raw || raw.toLowerCase() === "tbd" || raw.toLowerCase() === "none") {
    return result;
  }

  const entries = raw.split(",");

  for (const entry of entries) {
    const cleaned = entry.trim();
    if (!cleaned) continue;

    const match = cleaned.match(/^(.+?)\s*x\s*(\d+)$/i);
    if (!match) continue;

    const proteinName = normalizeProteinName(match[1]);
    const quantity = Number(match[2]);

    if (!proteinName || Number.isNaN(quantity) || quantity <= 0) continue;
    result[proteinName] = quantity;
  }

  return result;
}

function parseSheetDate(value) {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  const parsed = new Date(raw);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return raw;
}

function parseSheetTime(value) {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const raw = String(value).trim();
  const parsed = new Date(raw);

  if (!Number.isNaN(parsed.getTime())) {
    const hours = String(parsed.getHours()).padStart(2, "0");
    const minutes = String(parsed.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  return raw;
}

function inferPackageIdFromName(packageName, existingPackageId = "") {
  const raw = String(packageName || "").toLowerCase().trim();

  if (raw.includes("large party")) return "large-party-two-protein";
  if (raw.includes("3-protein")) return "three-protein";
  if (raw.includes("2-protein")) return "two-protein";

  return existingPackageId || "";
}

function parseBooleanLike(value) {
  if (value === true) return true;
  if (value === false) return false;

  const raw = String(value || "").trim().toLowerCase();
  return raw === "true" || raw === "yes";
}

function buildFormLikeObjectFromPayload(payload) {
  return {
    customer: payload.customer || {},
    event: payload.event || {},
    selection: {
      ...(payload.selection || {}),
      proteins: payload.selection?.proteins || {
        adult: {},
        kid: {},
      },
    },
    shared: payload.shared || {},
    food: payload.food || {},
    merchantSpecific: payload.merchantSpecific || {
      agreements: [],
    },
    notes: payload.notes || "",
    addOns: payload.selection?.addOns || {},
  };
}

function buildFormLikeObjectFromSheetRow(rowData, existingBooking = null) {
  const adultProteins = parseProteinText(rowData["Adult Proteins"]);
  const kidProteins = parseProteinText(rowData["Kid Proteins"]);

  const proteinStatus = String(rowData["Protein Status"] || "")
    .trim()
    .toLowerCase();

  const mealDecision =
    Object.keys(adultProteins).length > 0 ||
      Object.keys(kidProteins).length > 0 ||
      proteinStatus === "selected_by_customer" ||
      proteinStatus === "updated_by_staff"
      ? "now"
      : "later";

  const packageId = inferPackageIdFromName(
    rowData["Package Name"],
    existingBooking?.selection?.packageId || ""
  );

  return {
    customer: {
      firstName: String(rowData["First Name"] || "").trim(),
      lastName: String(rowData["Last Name"] || "").trim(),
      phone: String(rowData["Phone"] || "").trim(),
      email: String(rowData["Email"] || "").trim(),
    },

    event: {
      date: parseSheetDate(rowData["Event Date"]),
      time: parseSheetTime(rowData["Event Time"]),
      address: {
        street: String(rowData["Street"] || "").trim(),
        city: String(rowData["City"] || "").trim(),
        state: String(rowData["State"] || "").trim(),
        zipCode: String(rowData["ZIP"] || "").trim(),
      },
      adultCount: Number(rowData["Adult Count"] || 0),
      kidCount: Number(rowData["Kid Count"] || 0),
      travelMiles: Number(rowData["Travel Miles"] || 0),
    },

    selection: {
      packageId,
      mealDecision,
      proteins: {
        adult: adultProteins,
        kid: kidProteins,
      },
    },

    shared: {
      heardAbout: String(rowData["Heard About"] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      specialRequests: String(rowData["Special Requests"] || "").trim(),
      promoCode: String(rowData["Promo Code"] || "").trim(),
      birthday: {
        month: String(rowData["Birthday Month"] || "").trim(),
        day: String(rowData["Birthday Day"] || "").trim(),
        year: String(rowData["Birthday Year"] || "").trim(),
      },
      antiSpamAnswer: existingBooking?.shared?.antiSpamAnswer || "",
      antiSpamChallenge: existingBooking?.shared?.antiSpamChallenge || null,
    },

    food: {
      allergies: String(rowData["Allergies"] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },

    merchantSpecific: existingBooking?.merchantSpecific || {
      agreements: [],
    },

    notes: String(rowData["Internal Notes"] || "").trim(),
    addOns: existingBooking?.selection?.addOns || {},
  };
}

function buildBookingFromSheetRow(rowData, existingBooking = null) {
  const bookingId = String(rowData["Booking ID"] || "").trim();

  const merchantSlug = String(
    rowData["Merchant Slug"] ||
    rowData["merchantSlug"] ||
    existingBooking?.merchantSlug ||
    "kobe"
  ).trim();

  const merchant = getMerchantConfig(merchantSlug);

  if (!merchant) {
    throw new Error(`Invalid merchant slug: ${merchantSlug}.`);
  }

  const form = buildFormLikeObjectFromSheetRow(rowData, existingBooking);
  const recalculatedPricing = calculatePricing(form, merchant);

  const totalGuests =
    Number(form.event.adultCount || 0) + Number(form.event.kidCount || 0);

  const depositStatus = String(
    rowData["Deposit Status"] || existingBooking?.payment?.depositStatus || "unpaid"
  )
    .trim()
    .toLowerCase();

  const depositSelected =
    parseBooleanLike(rowData["Deposit Selected"]) || depositStatus === "paid";

  const status = String(
    rowData["Status"] || existingBooking?.status || "pending"
  ).trim();

  return {
    merchantSlug,
    bookingId,
    status,
    createdAt:
      existingBooking?.createdAt ||
      new Date(rowData["Created At"] || new Date()).toISOString(),
    updatedAt: new Date().toISOString(),

    customer: {
      firstName: form.customer.firstName,
      lastName: form.customer.lastName,
      name: `${form.customer.firstName} ${form.customer.lastName}`.trim(),
      phone: form.customer.phone,
      email: form.customer.email,
    },

    event: {
      date: form.event.date,
      time: form.event.time,
      address: {
        street: form.event.address.street,
        city: form.event.address.city,
        state: form.event.address.state,
        zipCode: form.event.address.zipCode,
      },
      travelMiles: Number(form.event.travelMiles || 0),
      guestCount: totalGuests,
      adultCount: Number(form.event.adultCount || 0),
      kidCount: Number(form.event.kidCount || 0),
    },

    selection: {
      packageId: form.selection.packageId,
      mealDecision: form.selection.mealDecision,
      proteins: {
        adult: form.selection.proteins.adult,
        kid: form.selection.proteins.kid,
      },
      addOns: form.addOns,
    },

    shared: {
      heardAbout: form.shared.heardAbout,
      specialRequests: form.shared.specialRequests,
      promoCode: form.shared.promoCode,
      birthday: form.shared.birthday,
      antiSpamAnswer: form.shared.antiSpamAnswer,
      antiSpamChallenge: form.shared.antiSpamChallenge,
    },

    food: {
      allergies: form.food.allergies,
    },

    merchantSpecific: existingBooking?.merchantSpecific || {
      agreements: [],
    },

    notes: form.notes,

    payment: {
      ...(existingBooking?.payment || {}),
      depositSelected,
      depositStatus,
      depositPaidAt:
        depositStatus === "paid"
          ? existingBooking?.payment?.depositPaidAt || new Date().toISOString()
          : existingBooking?.payment?.depositPaidAt,
    },

    pricingSnapshot: {
      ...recalculatedPricing,
      packageName: String(
        rowData["Package Name"] || recalculatedPricing.packageName || ""
      ).trim(),
      totalPrice: Number(recalculatedPricing.total || 0),
      total: Number(recalculatedPricing.total || 0),
    },
  };
}

router.post("/", async (req, res) => {
  console.log("POST /api/bookings payload:");
  console.dir(req.body, { depth: null });

  const payload = req.body;
  const validationError = validateBookingPayload(payload);

  if (validationError) {
    return res.status(400).json({
      success: false,
      error: validationError,
      receivedPayload: payload,
    });
  }

  const { merchantSlug, merchant } = getPayloadMerchant(payload);
  const formForPricing = buildFormLikeObjectFromPayload(payload);
  const recalculatedPricing = calculatePricing(formForPricing, merchant);

  const bookingId = `bk_${Date.now()}`;

  const bookingRecord = {
    ...payload,
    merchantSlug,
    bookingId,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payment: {
      ...(payload.payment || {}),
      depositStatus: payload?.payment?.depositStatus || "unpaid",
    },
    pricingSnapshot: {
      ...(payload.pricingSnapshot || {}),
      ...recalculatedPricing,
      totalPrice: Number(recalculatedPricing.total || recalculatedPricing.totalPrice || 0),
      total: Number(recalculatedPricing.total || recalculatedPricing.totalPrice || 0),
    },
  };

  bookingStore.set(bookingId, bookingRecord);
const createdBooking = await Booking.create(bookingRecord);

try {
  await sendBookingEmails({
    booking: bookingRecord,
    mode: "initial",
  });

  console.log("✅ Initial booking emails sent");
} catch (emailError) {
  console.error("INITIAL BOOKING EMAIL ERROR:", emailError);
}

try {
  const calendarResult = await upsertBookingCalendarEvent(
    bookingRecord,
    "initial",
  );

  if (calendarResult?.success && calendarResult?.eventId) {
    createdBooking.googleCalendarEventId = calendarResult.eventId;
    createdBooking.googleCalendarHtmlLink = calendarResult.htmlLink || "";
    createdBooking.calendarSync = {
      status: "synced",
      provider: "google_calendar",
      eventId: calendarResult.eventId,
      htmlLink: calendarResult.htmlLink || "",
      lastSyncedAt: new Date().toISOString(),
      mode: "initial",
    };
    createdBooking.updatedAt = new Date().toISOString();

    await createdBooking.save();

    bookingRecord.googleCalendarEventId = calendarResult.eventId;
    bookingRecord.googleCalendarHtmlLink = calendarResult.htmlLink || "";
    bookingRecord.calendarSync = createdBooking.calendarSync;
    bookingStore.set(bookingId, bookingRecord);

    console.log("✅ Booking synced to Google Calendar");
  }
} catch (calendarError) {
  console.error("INITIAL BOOKING CALENDAR ERROR:", calendarError);

  createdBooking.calendarSync = {
    ...(createdBooking.calendarSync || {}),
    status: "failed",
    provider: "google_calendar",
    lastSyncedAt: new Date().toISOString(),
    mode: "initial",
    error: calendarError.message,
  };

  await createdBooking.save();
}

try {
  const spreadsheetId =
    merchant?.integrations?.googleSheets?.spreadsheetId ||
    merchant?.googleSheets?.spreadsheetId ||
    merchant?.sheetId;

  const sheetName =
    merchant?.integrations?.googleSheets?.sheetName || "Bookings";

  if (spreadsheetId) {
    const rowData = bookingSheetMapper({
      booking: bookingRecord,
      merchant,
      pricing: bookingRecord.pricingSnapshot || {},
    });

    await appendBookingRow({
      spreadsheetId,
      sheetName,
      rowData,
    });

    console.log("✅ Booking row appended to Google Sheet");
  } else {
    console.warn(
      `⚠️ No Google Sheet spreadsheetId found for merchant: ${merchantSlug}`,
    );
  }
} catch (sheetError) {
  console.error("INITIAL BOOKING SHEET ERROR:", sheetError);
}

  return res.status(201).json({
    success: true,
    bookingId,
    message: "Booking request received successfully.",
    booking: bookingRecord,
  });
});

router.get("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking =
      bookingStore.get(bookingId) ||
      (await Booking.findOne({ bookingId }).lean());

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found.",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("GET BOOKING ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load booking.",
    });
  }
});

router.patch("/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  const existingBooking = bookingStore.get(bookingId);

  if (!existingBooking) {
    return res.status(404).json({
      success: false,
      error: "Booking not found.",
    });
  }

  const updates = req.body || {};

  const updatedBooking = {
    ...existingBooking,
    ...updates,
    customer: {
      ...(existingBooking.customer || {}),
      ...(updates.customer || {}),
    },
    event: {
      ...(existingBooking.event || {}),
      ...(updates.event || {}),
      address: {
        ...(existingBooking.event?.address || {}),
        ...(updates.event?.address || {}),
      },
    },
    selection: {
      ...(existingBooking.selection || {}),
      ...(updates.selection || {}),
      proteins: {
        adult: {
          ...(existingBooking.selection?.proteins?.adult || {}),
          ...(updates.selection?.proteins?.adult || {}),
        },
        kid: {
          ...(existingBooking.selection?.proteins?.kid || {}),
          ...(updates.selection?.proteins?.kid || {}),
        },
      },
    },
    shared: {
      ...(existingBooking.shared || {}),
      ...(updates.shared || {}),
    },
    food: {
      ...(existingBooking.food || {}),
      ...(updates.food || {}),
    },
    merchantSpecific: {
      ...(existingBooking.merchantSpecific || {}),
      ...(updates.merchantSpecific || {}),
    },
    pricingSnapshot: {
      ...(existingBooking.pricingSnapshot || {}),
      ...(updates.pricingSnapshot || {}),
    },
    payment: {
      ...(existingBooking.payment || {}),
      ...(updates.payment || {}),
    },
    notes:
      updates.notes !== undefined ? updates.notes : existingBooking.notes,
    status: updates.status || existingBooking.status || "pending",
    updatedAt: new Date().toISOString(),
  };

  bookingStore.set(bookingId, updatedBooking);

  return res.status(200).json({
    success: true,
    message: "Booking updated successfully.",
    booking: updatedBooking,
  });
});

router.post("/restore-from-sheet", (req, res) => {
  try {
    const rowData = req.body || {};
    const bookingId = String(rowData["Booking ID"] || "").trim();

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: "Missing Booking ID in sheet row payload.",
      });
    }

    const existingBooking = bookingStore.get(bookingId) || null;
    const restoredBooking = buildBookingFromSheetRow(rowData, existingBooking);

    const merchant = getMerchantConfig(restoredBooking.merchantSlug);
    const minimumOrderTotal = Number(merchant?.booking?.minimumOrderTotal || 0);

    if (
      minimumOrderTotal > 0 &&
      Number(restoredBooking?.pricingSnapshot?.totalPrice || 0) < minimumOrderTotal
    ) {
      return res.status(400).json({
        success: false,
        error: `Minimum booking total for ${merchant.business?.name || restoredBooking.merchantSlug} is $${minimumOrderTotal}.`,
      });
    }

    bookingStore.set(bookingId, restoredBooking);

    return res.status(200).json({
      success: true,
      message: "Booking restored from sheet successfully.",
      booking: restoredBooking,
    });
  } catch (error) {
    console.error("RESTORE FROM SHEET ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to restore booking from sheet.",
    });
  }
});

router.post("/:bookingId/resend-update", async (req, res) => {
  const { bookingId } = req.params;
  const booking = bookingStore.get(bookingId);

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: "Booking not found.",
    });
  }

  try {
    await sendBookingEmails({
      booking,
      mode: "updated",
    });

    await upsertBookingCalendarEvent(booking, "updated");

    return res.status(200).json({
      success: true,
      message: "Updated booking email sent successfully.",
    });
  } catch (error) {
    console.error("RESEND UPDATE EMAIL ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to resend updated booking email.",
    });
  }
});

router.post("/:bookingId/mark-deposit-paid", async (req, res) => {
  const { bookingId } = req.params;
  const booking = bookingStore.get(bookingId);

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: "Booking not found.",
    });
  }

  const updatedBooking = {
    ...booking,
    payment: {
      ...(booking.payment || {}),
      depositSelected: true,
      depositStatus: "paid",
      depositPaidAt: new Date().toISOString(),
    },
    status: "deposit_paid",
    updatedAt: new Date().toISOString(),
  };

  bookingStore.set(bookingId, updatedBooking);

  try {
    await sendBookingEmails({
      booking: updatedBooking,
      mode: "deposit_paid",
    });

    await upsertBookingCalendarEvent(updatedBooking, "deposit_paid");

    return res.status(200).json({
      success: true,
      message: "Deposit marked as paid and emails sent.",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("DEPOSIT EMAIL ERROR:", error);

    return res.status(500).json({
      success: false,
      error: "Deposit was marked paid, but email sending failed.",
    });
  }
});

router.bookingStore = bookingStore;

module.exports = router;