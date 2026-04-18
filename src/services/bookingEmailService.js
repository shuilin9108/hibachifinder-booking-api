const { Resend } = require("resend");
const { generateInvoiceBuffer } = require("../utils/generateInvoice");

const resend = new Resend(process.env.RESEND_API_KEY);

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

async function sendBookingEmails({ booking, mode = "initial" }) {
  const customer = booking?.customer || {};
  const event = booking?.event || {};
  const pricing = booking?.pricingSnapshot || {};
  const payment = booking?.payment || {};
  const food = booking?.food || {};

  const bookingId = booking?.bookingId || "";

  const totalPrice = Number(pricing?.totalPrice || 0);
  const depositAmount = Number(pricing?.deposit || 50);

  const depositPaid =
    String(payment?.depositStatus || "").toLowerCase() === "paid";

  const depositStatusText = depositPaid ? "paid" : "not paid yet";

  const remainingAfterDeposit = Math.max(0, totalPrice - depositAmount);

  const addOnsDetails = pricing?.addOnsDetails || "None";

  const allergyText =
    Array.isArray(food?.allergies) && food.allergies.length > 0
      ? food.allergies.join(", ")
      : "None provided";

  const pdfBuffer = await generateInvoiceBuffer(booking);

  // =========================
  // CUSTOMER EMAIL
  // =========================

  const customerHtml = `
  <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    
    <h2>Thank you for your booking request</h2>
    <p>We received your hibachi booking request and will contact you shortly.</p>

    <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;margin:20px 0;">
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Date:</strong> ${event?.date || ""}</p>
      <p><strong>Time:</strong> ${event?.time || ""}</p>
      <p><strong>Guests:</strong> ${event?.guestCount || 0}</p>
      <p><strong>Package:</strong> ${pricing?.packageName || ""}</p>
      <p><strong>Total Price:</strong> ${money(totalPrice)}</p>
    </div>

    <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;margin:20px 0;">
      <h3 style="margin-top:0;">Deposit</h3>
      <p><strong>Deposit Amount:</strong> ${money(depositAmount)}</p>
      <p><strong>Deposit Status:</strong> ${depositStatusText}</p>
      ${
        depositPaid
          ? `<p><strong>Remaining After Deposit Payment:</strong> ${money(
              remainingAfterDeposit
            )}</p>`
          : ""
      }
    </div>

    ${
      !depositPaid
        ? `
    <div style="padding:16px;border-radius:12px;background:#0f172a;color:white;margin:20px 0;">
      <p>Pay your deposit to secure your date faster:</p>
      <a href="https://buy.stripe.com/9B6eVeabl5qXfbQ85Y2kw00"
         style="display:inline-block;padding:12px 18px;background:#22c55e;color:white;text-decoration:none;border-radius:10px;font-weight:bold;">
        Pay ${money(depositAmount)} Deposit
      </a>
    </div>
    `
        : ""
    }

    <div style="padding:16px;border:1px solid #fecaca;border-radius:12px;background:#fef2f2;margin:20px 0;">
      <h3 style="margin-top:0;color:#b91c1c;">Allergy Alert</h3>
      <p style="color:#dc2626;font-weight:bold;">${allergyText}</p>
    </div>

    <p>The attached PDF includes full breakdown, selections, and gratuity suggestions.</p>

  </div>
  `;

  // =========================
  // MERCHANT EMAIL
  // =========================

  const merchantHtml = `
  <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    
    <h2>🔥 Booking Update (${mode})</h2>

    <p><strong>Booking ID:</strong> ${bookingId}</p>
    <p><strong>Name:</strong> ${customer?.name || ""}</p>
    <p><strong>Phone:</strong> ${customer?.phone || ""}</p>
    <p><strong>Email:</strong> ${customer?.email || ""}</p>

    <p><strong>Date:</strong> ${event?.date || ""}</p>
    <p><strong>Time:</strong> ${event?.time || ""}</p>
    <p><strong>Guests:</strong> ${event?.guestCount || 0}</p>

    <p><strong>Package:</strong> ${pricing?.packageName || ""}</p>
    <p><strong>Travel Fee:</strong> ${money(pricing?.travelFee || 0)}</p>
    <p><strong>Total Price:</strong> ${money(totalPrice)}</p>

    <p><strong>Deposit Status:</strong> ${depositStatusText}</p>

    ${
      depositPaid
        ? `<p><strong>Remaining:</strong> ${money(
            remainingAfterDeposit
          )}</p>`
        : ""
    }

    <div style="padding:16px;border:1px solid #fecaca;border-radius:12px;background:#fef2f2;margin:20px 0;">
      <strong style="color:#b91c1c;">Allergies:</strong>
      <span style="color:#dc2626;font-weight:bold;">${allergyText}</span>
    </div>

  </div>
  `;

  // =========================
  // SEND EMAILS
  // =========================

  if (customer?.email) {
    await resend.emails.send({
      from: "ShuiLink Booking <booking@shuilink.com>",
      to: customer.email,
      subject: `Your Booking - ${bookingId}`,
      html: customerHtml,
      attachments: [
        {
          filename: `booking-${bookingId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  }

  await resend.emails.send({
    from: "ShuiLink Booking <booking@shuilink.com>",
    to: ["shuilin9108@gmail.com", "shuilin0823@gmail.com"],
    subject: `Booking Update - ${bookingId}`,
    html: merchantHtml,
    attachments: [
      {
        filename: `booking-${bookingId}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}

module.exports = { sendBookingEmails };