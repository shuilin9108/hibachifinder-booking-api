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

function safe(value, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function joinAddress(address = {}) {
  const parts = [
    address?.street,
    address?.city,
    address?.state,
    address?.zipCode,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Not provided";
}

function drawHeader(doc) {
  doc.rect(0, 0, 612, 72).fill("#0f172a");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("Hibachi Booking Invoice", 0, 24, {
      width: 612,
      align: "center",
    });

  doc.fillColor("#111111");
}

function drawSectionTitle(doc, title, x, y) {
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#111111")
    .text(title, x, y, { width: 220 });
}

function drawLine(doc, x1, y1, x2, y2, color = "#dddddd") {
  doc
    .strokeColor(color)
    .lineWidth(1)
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .stroke();
}

function drawRow(doc, label, value, x, y, options = {}) {
  const {
    labelWidth = 92,
    valueX = x + 98,
    valueWidth = 118,
    valueAlign = "right",
    labelColor = "#444444",
    valueColor = "#111111",
    boldValue = true,
    fontSize = 10,
  } = options;

  doc
    .font("Helvetica")
    .fontSize(fontSize)
    .fillColor(labelColor)
    .text(label, x, y, {
      width: labelWidth,
      lineBreak: false,
    });

  doc
    .font(boldValue ? "Helvetica-Bold" : "Helvetica")
    .fontSize(fontSize)
    .fillColor(valueColor)
    .text(safe(value, ""), valueX, y, {
      width: valueWidth,
      align: valueAlign,
      lineBreak: false,
    });

  return y + 16;
}

function drawWrappedBlock(doc, label, value, x, y, width, options = {}) {
  const {
    labelColor = "#444444",
    valueColor = "#111111",
    valueBold = true,
    labelFontSize = 10,
    valueFontSize = 10,
    gap = 2,
  } = options;

  doc
    .font("Helvetica")
    .fontSize(labelFontSize)
    .fillColor(labelColor)
    .text(label, x, y, { width });

  const valueY = doc.y + gap;

  doc
    .font(valueBold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(valueFontSize)
    .fillColor(valueColor)
    .text(safe(value), x, valueY, { width });

  return doc.y;
}

function generateInvoiceBuffer(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 36,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const customer = booking?.customer || {};
    const event = booking?.event || {};
    const selection = booking?.selection || {};
    const shared = booking?.shared || {};
    const food = booking?.food || {};
    const pricing = booking?.pricingSnapshot || {};
    const payment = booking?.payment || {};

    const customerName =
      customer?.name ||
      [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") ||
      "Not provided";

    const addressText = joinAddress(event?.address || {});

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
    const adultSubtotal = Number(pricing?.adultSubtotal || 0);
    const kidSubtotal = Number(pricing?.kidSubtotal || 0);
    const addOnTotal = Number(pricing?.addOnTotal || 0);
    const proteinUpgradeTotal = Number(pricing?.proteinUpgradeTotal || 0);
    const travelMiles = Number(pricing?.travelMiles || 0);
    const travelFee = Number(pricing?.travelFee || 0);
    const discountedSubtotal = Number(pricing?.subtotal || 0);
    const tax = Number(pricing?.tax || 0);
    const totalPrice = Number(pricing?.totalPrice || pricing?.total || 0);

    const depositAmount = Number(pricing?.deposit || 50);
    const depositPaid =
      String(payment?.depositStatus || "").toLowerCase() === "paid";
    const depositStatusText = depositPaid ? "PAID" : "NOT PAID";
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

    const birthdayMonth = shared?.birthday?.month || "Not provided";
    const birthdayDay = shared?.birthday?.day || "Not provided";
    const birthdayYear = shared?.birthday?.year || "Not provided";

    drawHeader(doc);

    const leftX = 42;
    const rightX = 324;
    const colWidth = 246;
    const centerX = 306;
    const startY = 92;

    let leftY = startY;
    let rightY = startY;

    drawLine(doc, centerX, 86, centerX, 718, "#d9d9d9");

    // LEFT COLUMN
    drawSectionTitle(doc, "Booking Summary", leftX, leftY);
    leftY += 18;
    leftY = drawRow(doc, "Booking ID", safe(booking?.bookingId, ""), leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
      boldValue: false,
      fontSize: 9,
    });
    leftY = drawRow(doc, "Created At", safe(booking?.createdAt, ""), leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
      boldValue: false,
      fontSize: 9,
    });
    leftY += 6;

    drawLine(doc, leftX, leftY, leftX + colWidth, leftY);
    leftY += 10;

    drawSectionTitle(doc, "Customer", leftX, leftY);
    leftY += 18;
    leftY = drawRow(doc, "Name", customerName, leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
    });
    leftY = drawRow(doc, "Phone", customer?.phone || "Not provided", leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
    });
    leftY = drawRow(doc, "Email", customer?.email || "Not provided", leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
    });
    leftY += 6;

    drawLine(doc, leftX, leftY, leftX + colWidth, leftY);
    leftY += 10;

    drawSectionTitle(doc, "Event", leftX, leftY);
    leftY += 18;
    leftY = drawRow(doc, "Date", event?.date || "Not selected", leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
    });
    leftY = drawRow(doc, "Time", event?.time || "Not selected", leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
    });
    leftY = drawRow(doc, "Guests", event?.guestCount || 0, leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
    });
    leftY = drawRow(doc, "Adults", event?.adultCount || 0, leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
    });
    leftY = drawRow(doc, "Kids", event?.kidCount || 0, leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
    });
    leftY += 4;

    leftY = drawWrappedBlock(doc, "Address", addressText, leftX, leftY, colWidth, {
      valueBold: true,
      valueFontSize: 10,
    });
    leftY += 8;

    drawLine(doc, leftX, leftY, leftX + colWidth, leftY);
    leftY += 10;

    drawSectionTitle(doc, "Selections", leftX, leftY);
    leftY += 16;

    leftY = drawWrappedBlock(
      doc,
      "Meal Decision",
      selection?.mealDecision === "now"
        ? "Protein selections were provided"
        : "Protein selections will be confirmed later by staff",
      leftX,
      leftY,
      colWidth,
      { valueBold: false }
    );
    leftY += 8;

    leftY = drawWrappedBlock(doc, "Adult Proteins", adultProteins, leftX, leftY, colWidth, {
      valueBold: true,
    });
    leftY += 8;

    leftY = drawWrappedBlock(doc, "Kid Proteins", kidProteins, leftX, leftY, colWidth, {
      valueBold: true,
    });
    leftY += 8;

    leftY = drawWrappedBlock(doc, "Add-Ons Details", addOnsDetails, leftX, leftY, colWidth, {
      valueBold: true,
    });
    leftY += 8;

    drawLine(doc, leftX, leftY, leftX + colWidth, leftY);
    leftY += 10;

    drawSectionTitle(doc, "Additional Information", leftX, leftY);
    leftY += 18;
    leftY = drawRow(doc, "Promo Code", promoCode, leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
      boldValue: false,
    });
    leftY = drawRow(doc, "Birth Month", birthdayMonth, leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
      boldValue: false,
    });
    leftY = drawRow(doc, "Birth Day", birthdayDay, leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
      boldValue: false,
    });
    leftY = drawRow(doc, "Birth Year", birthdayYear, leftX, leftY, {
      labelWidth: 92,
      valueX: leftX + 98,
      valueWidth: 148,
      valueAlign: "left",
      boldValue: false,
    });

    leftY = drawWrappedBlock(doc, "Heard About Us", heardAboutText, leftX, leftY + 2, colWidth, {
      valueBold: false,
    });
    leftY += 8;

    leftY = drawWrappedBlock(doc, "Special Requests", specialRequestsText, leftX, leftY, colWidth, {
      valueBold: false,
    });
    leftY += 8;

    leftY = drawWrappedBlock(doc, "Notes", notesText, leftX, leftY, colWidth, {
      valueBold: false,
    });
    leftY += 10;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#b91c1c")
      .text("⚠ ALLERGIES / DIETARY ALERT", leftX, leftY, { width: colWidth });

    leftY = doc.y + 2;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#dc2626")
      .text(allergiesText, leftX, leftY, { width: colWidth });

    // RIGHT COLUMN
    drawSectionTitle(doc, "Pricing Breakdown", rightX, rightY);
    rightY += 18;

    rightY = drawRow(doc, "Package", pricing?.packageName || "Not selected", rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
      valueAlign: "right",
    });
    rightY = drawRow(doc, "Adult Subtotal", money(adultSubtotal), rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(doc, "Kid Subtotal", money(kidSubtotal), rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(doc, "Add-Ons Total", money(addOnTotal), rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(
      doc,
      "Protein Upgrade",
      money(proteinUpgradeTotal),
      rightX,
      rightY,
      {
        labelWidth: 96,
        valueX: rightX + 102,
        valueWidth: 132,
      }
    );
    rightY = drawRow(doc, "Travel Miles", `${travelMiles} mi`, rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(doc, "Travel Fee", money(travelFee), rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(
      doc,
      "Sub Before Disc.",
      money(subtotalBeforeDiscount),
      rightX,
      rightY,
      {
        labelWidth: 96,
        valueX: rightX + 102,
        valueWidth: 132,
      }
    );
    rightY = drawRow(doc, "Birthday Disc.", `-${money(birthdayDiscount)}`, rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(doc, "Promo Disc.", `-${money(promoDiscount)}`, rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(doc, "Discounted Sub", money(discountedSubtotal), rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(doc, "Estimated Tax", money(tax), rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(doc, "Total Price", money(totalPrice), rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
      valueColor: "#0f172a",
    });

    rightY += 6;
    drawLine(doc, rightX, rightY, rightX + colWidth, rightY);
    rightY += 10;

    drawSectionTitle(doc, "Deposit", rightX, rightY);
    rightY += 18;
    rightY = drawRow(doc, "Deposit Amt", money(depositAmount), rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
    });
    rightY = drawRow(doc, "Deposit Status", depositStatusText, rightX, rightY, {
      labelWidth: 96,
      valueX: rightX + 102,
      valueWidth: 132,
      valueColor: depositPaid ? "#15803d" : "#991b1b",
    });

    if (depositPaid) {
      rightY = drawRow(
        doc,
        "Remaining",
        money(remainingAfterDeposit),
        rightX,
        rightY,
        {
          labelWidth: 96,
          valueX: rightX + 102,
          valueWidth: 132,
        }
      );
    }

    rightY += 6;
    drawLine(doc, rightX, rightY, rightX + colWidth, rightY);
    rightY += 10;

    drawSectionTitle(doc, "Suggested Gratuity", rightX, rightY);
    rightY += 18;
    rightY = drawRow(
      doc,
      "18%",
      `${money(gratuity18)} | Total ${money(totalPrice + gratuity18)}`,
      rightX,
      rightY,
      {
        labelWidth: 52,
        valueX: rightX + 58,
        valueWidth: 188,
        valueAlign: "left",
        boldValue: false,
      }
    );
    rightY = drawRow(
      doc,
      "20%",
      `${money(gratuity20)} | Total ${money(totalPrice + gratuity20)}`,
      rightX,
      rightY,
      {
        labelWidth: 52,
        valueX: rightX + 58,
        valueWidth: 188,
        valueAlign: "left",
        boldValue: false,
      }
    );
    rightY = drawRow(
      doc,
      "25%",
      `${money(gratuity25)} | Total ${money(totalPrice + gratuity25)}`,
      rightX,
      rightY,
      {
        labelWidth: 52,
        valueX: rightX + 58,
        valueWidth: 188,
        valueAlign: "left",
        boldValue: false,
      }
    );
    rightY = drawRow(
      doc,
      "30%",
      `${money(gratuity30)} | Total ${money(totalPrice + gratuity30)}`,
      rightX,
      rightY,
      {
        labelWidth: 52,
        valueX: rightX + 58,
        valueWidth: 188,
        valueAlign: "left",
        boldValue: false,
      }
    );

    rightY += 6;
    drawLine(doc, rightX, rightY, rightX + colWidth, rightY);
    rightY += 10;

    drawSectionTitle(doc, "Operational Notes", rightX, rightY);
    rightY += 18;

    rightY = drawWrappedBlock(
      doc,
      "Invoice Note",
      "This invoice was generated by ShuiLink Booking Engine. Deposit payment, staff follow-up, and final operational confirmation may occur after this request is reviewed.",
      rightX,
      rightY,
      colWidth,
      {
        valueBold: false,
        valueFontSize: 9,
      }
    );

    doc.end();
  });
}

module.exports = { generateInvoiceBuffer };