const PDFDocument = require("pdfkit");

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatProteinMap(map = {}) {
  const result = Object.entries(map)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([name, qty]) => `${name} x${qty}`)
    .join(", ");

  return result || "TBD";
}

function drawRow(doc, label, value, options = {}) {
  const {
    labelX = 55,
    valueX = 360,
    y = doc.y,
    valueColor = "#111111",
    labelColor = "#444444",
    boldValue = true,
  } = options;

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(labelColor)
    .text(label, labelX, y, { width: 220 });

  doc
    .font(boldValue ? "Helvetica-Bold" : "Helvetica")
    .fontSize(11)
    .fillColor(valueColor)
    .text(String(value ?? ""), valueX, y, {
      width: 180,
      align: "right",
    });

  doc.moveDown(0.25);
}

function drawDivider(doc) {
  const y = doc.y + 4;
  doc
    .strokeColor("#dddddd")
    .lineWidth(1)
    .moveTo(55, y)
    .lineTo(555, y)
    .stroke();
  doc.moveDown(0.7);
}

function generateInvoiceBuffer(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 50,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const customer = booking?.customer || {};
    const event = booking?.event || {};
    const address = event?.address || {};
    const selection = booking?.selection || {};
    const shared = booking?.shared || {};
    const food = booking?.food || {};
    const pricing = booking?.pricingSnapshot || {};
    const payment = booking?.payment || {};

    const addOnsDetails = pricing?.addOnsDetails || "None";

    const adultProteins =
      selection?.mealDecision === "now"
        ? formatProteinMap(selection?.proteins?.adult || {})
        : "TBD";

    const kidProteins =
      selection?.mealDecision === "now"
        ? formatProteinMap(selection?.proteins?.kid || {})
        : "TBD";

    const subtotalBeforeDiscount = Number(pricing?.subtotalBeforeDiscount || 0);
    const discountedSubtotal = Number(pricing?.subtotal || 0);
    const tax = Number(pricing?.tax || 0);
    const totalPrice = Number(pricing?.totalPrice || pricing?.total || 0);

    const depositAmount = Number(pricing?.deposit || 50);
    const depositPaid =
      String(payment?.depositStatus || "").toLowerCase() === "paid";
    const depositStatusText = depositPaid ? "paid" : "not paid yet";
    const remainingAfterDeposit = Math.max(0, totalPrice - depositAmount);

    const promoCode = shared?.promoCode || "None";
    const promoDiscount = Number(pricing?.promoCodeDiscount || 0);
    const birthdayDiscount = Number(pricing?.birthdayDiscount || 0);

    const gratuity18 = Number((totalPrice * 0.18).toFixed(2));
    const gratuity20 = Number((totalPrice * 0.2).toFixed(2));
    const gratuity25 = Number((totalPrice * 0.25).toFixed(2));
    const gratuity30 = Number((totalPrice * 0.3).toFixed(2));

    const allergiesText =
      Array.isArray(food?.allergies) && food.allergies.length > 0
        ? food.allergies.join(", ")
        : "None provided";

    const heardAboutText =
      Array.isArray(shared?.heardAbout) && shared.heardAbout.length > 0
        ? shared.heardAbout.join(", ")
        : "Not provided";

    const specialRequestsText = shared?.specialRequests || "None";
    const notesText = booking?.notes || "None";

    doc.rect(0, 0, 612, 80).fill("#0f172a");
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("Hibachi Booking Invoice", 50, 28, { align: "center" });

    doc.moveDown(2.5);
    doc.fillColor("#111111");

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("Booking Summary", 55, 100);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#555555")
      .text(`Booking ID: ${booking?.bookingId || ""}`, 55, 125)
      .text(`Created At: ${booking?.createdAt || ""}`, 55, 142);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111111")
      .text("Customer", 55, 180);

    drawRow(doc, "Name", customer?.name || "", { y: 205 });
    drawRow(doc, "Phone", customer?.phone || "");
    drawRow(doc, "Email", customer?.email || "");
    drawDivider(doc);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111111")
      .text("Event", 55, doc.y);

    drawRow(doc, "Event Date", event?.date || "", { y: doc.y + 8 });
    drawRow(doc, "Event Time", event?.time || "");
    drawRow(
      doc,
      "Address",
      `${address?.street || ""}, ${address?.city || ""}, ${address?.state || ""} ${address?.zipCode || ""}`
    );
    drawRow(doc, "Total Guests", event?.guestCount || 0);
    drawRow(doc, "Adults", event?.adultCount || 0);
    drawRow(doc, "Kids", event?.kidCount || 0);
    drawDivider(doc);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111111")
      .text("Pricing Breakdown", 55, doc.y);

    drawRow(doc, "Package", pricing?.packageName || "", { y: doc.y + 8 });
    drawRow(doc, "Adult Subtotal", money(pricing?.adultSubtotal || 0));
    drawRow(doc, "Kid Subtotal", money(pricing?.kidSubtotal || 0));
    drawRow(doc, "Add-Ons Total", money(pricing?.addOnTotal || 0));
    drawRow(
      doc,
      "Protein Upgrade Fee",
      money(pricing?.proteinUpgradeTotal || 0)
    );
    drawRow(doc, "Travel Distance", `${pricing?.travelMiles || 0} mi`);
    drawRow(doc, "Travel Fee", money(pricing?.travelFee || 0));
    drawRow(
      doc,
      "Subtotal Before Discount",
      money(subtotalBeforeDiscount)
    );
    drawRow(doc, "Birthday Discount", `-${money(birthdayDiscount)}`);
    drawRow(doc, "Promo Discount", `-${money(promoDiscount)}`);
    drawRow(doc, "Discounted Subtotal", money(discountedSubtotal));
    drawRow(doc, "Estimated Tax", money(tax));
    drawRow(doc, "Total Price", money(totalPrice), {
      valueColor: "#0f172a",
    });
    drawDivider(doc);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111111")
      .text("Deposit", 55, doc.y);

    drawRow(doc, "Deposit Amount", money(depositAmount), { y: doc.y + 8 });
    drawRow(doc, "Deposit Status", depositStatusText, { boldValue: false });

    if (depositPaid) {
      drawRow(
        doc,
        "Remaining After Deposit Payment",
        money(remainingAfterDeposit)
      );
    }

    drawDivider(doc);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111111")
      .text("Selections", 55, doc.y);

    drawRow(
      doc,
      "Meal Decision",
      selection?.mealDecision === "now"
        ? "Protein selections were provided"
        : "Protein selections will be confirmed later by staff",
      { y: doc.y + 8, boldValue: false }
    );

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#444444")
      .text("Adult Proteins", 55, doc.y + 6);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111111")
      .text(adultProteins, 55, doc.y + 2, { width: 500 });

    doc.moveDown(0.7);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#444444")
      .text("Kid Proteins", 55, doc.y);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111111")
      .text(kidProteins, 55, doc.y + 2, { width: 500 });

    doc.moveDown(0.9);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#444444")
      .text("Add-Ons Details", 55, doc.y);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111111")
      .text(addOnsDetails, 55, doc.y + 2, { width: 500 });

    doc.moveDown(1);
    drawDivider(doc);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111111")
      .text("Additional Information", 55, doc.y);

    drawRow(doc, "Promo Code", promoCode, {
      y: doc.y + 8,
      boldValue: false,
    });
    drawRow(doc, "Birthday Month", shared?.birthday?.month || "Not provided", {
      boldValue: false,
    });
    drawRow(doc, "Birthday Day", shared?.birthday?.day || "Not provided", {
      boldValue: false,
    });
    drawRow(doc, "Birthday Year", shared?.birthday?.year || "Not provided", {
      boldValue: false,
    });
    drawRow(doc, "How Did You Hear About Us", heardAboutText, {
      boldValue: false,
    });

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#444444")
      .text("Special Requests", 55, doc.y + 8);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111111")
      .text(specialRequestsText, 55, doc.y + 2, { width: 500 });

    doc.moveDown(0.8);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#444444")
      .text("Notes", 55, doc.y);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111111")
      .text(notesText, 55, doc.y + 2, { width: 500 });

    doc.moveDown(0.8);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#b91c1c")
      .text("Allergies / Dietary Alert", 55, doc.y);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#dc2626")
      .text(allergiesText, 55, doc.y + 2, { width: 500 });

    doc.moveDown(1);
    drawDivider(doc);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#111111")
      .text("Suggested Gratuity", 55, doc.y);

    drawRow(
      doc,
      "18%",
      `${money(gratuity18)}  |  Grand Total ${money(totalPrice + gratuity18)}`,
      {
        y: doc.y + 8,
        boldValue: false,
      }
    );
    drawRow(
      doc,
      "20%",
      `${money(gratuity20)}  |  Grand Total ${money(totalPrice + gratuity20)}`,
      {
        boldValue: false,
      }
    );
    drawRow(
      doc,
      "25%",
      `${money(gratuity25)}  |  Grand Total ${money(totalPrice + gratuity25)}`,
      {
        boldValue: false,
      }
    );
    drawRow(
      doc,
      "30%",
      `${money(gratuity30)}  |  Grand Total ${money(totalPrice + gratuity30)}`,
      {
        boldValue: false,
      }
    );

    doc.moveDown(1.2);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#666666")
      .text(
        "This invoice was generated by ShuiLink Booking Engine. Deposit payment, staff follow-up, and any final operational confirmation may occur after this request is reviewed.",
        55,
        doc.y,
        { width: 500, align: "left" }
      );

    doc.end();
  });
}

module.exports = { generateInvoiceBuffer };