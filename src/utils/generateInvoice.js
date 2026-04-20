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

function safeText(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function drawSectionTitle(doc, text, x, y) {
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#111111")
    .text(text, x, y, { width: 220 });
}

function drawLabelValueRow(doc, label, value, x, y, options = {}) {
  const {
    labelWidth = 90,
    valueWidth = 120,
    rowHeight = 18,
    valueAlign = "right",
    valueColor = "#111111",
    labelColor = "#555555",
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
    .text(safeText(value), x + labelWidth + 8, y, {
      width: valueWidth,
      align: valueAlign,
      lineBreak: false,
    });

  return y + rowHeight;
}

function drawDivider(doc, x1, x2, y) {
  doc
    .strokeColor("#dddddd")
    .lineWidth(1)
    .moveTo(x1, y)
    .lineTo(x2, y)
    .stroke();
}

function drawWrappedBlock(doc, title, value, x, y, width, options = {}) {
  const {
    titleColor = "#444444",
    valueColor = "#111111",
    titleFont = "Helvetica",
    valueFont = "Helvetica-Bold",
    titleSize = 10,
    valueSize = 10,
    gapAfterTitle = 3,
    gapAfterBlock = 10,
  } = options;

  doc
    .font(titleFont)
    .fontSize(titleSize)
    .fillColor(titleColor)
    .text(title, x, y, { width });

  const titleBottom = doc.y;

  doc
    .font(valueFont)
    .fontSize(valueSize)
    .fillColor(valueColor)
    .text(safeText(value, "None"), x, titleBottom + gapAfterTitle, { width });

  return doc.y + gapAfterBlock;
}

function generateInvoiceBuffer(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 0,
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

    const bookingId = booking?.bookingId || "";
    const createdAt = booking?.createdAt || "";

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

    const mealDecisionText =
      selection?.mealDecision === "now"
        ? "Protein selections were provided"
        : "Protein selections will be confirmed later by staff";

    const fullAddress = [
      address?.street || "",
      address?.city || "",
      address?.state || "",
      address?.zipCode || "",
    ]
      .join(", ")
      .replace(/, ,/g, ",")
      .replace(/\s+,/g, ",")
      .trim()
      .replace(/^,+|,+$/g, "");

    const pageWidth = 612;
    const pageHeight = 792;
    const headerHeight = 68;

    const leftX = 42;
    const midX = 306;
    const rightX = 326;
    const columnWidth = 244;
    const contentTop = 92;
    const contentBottomLimit = 748;

    doc.rect(0, 0, pageWidth, headerHeight).fill("#0b1635");
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("Hibachi Booking Invoice", 0, 22, {
        width: pageWidth,
        align: "center",
      });

    drawDivider(doc, midX, midX, contentTop);

    let leftY = contentTop;
    let rightY = contentTop;

    drawSectionTitle(doc, "Booking Summary", leftX, leftY);
    leftY += 24;
    leftY = drawLabelValueRow(doc, "Booking ID", bookingId, leftX, leftY, {
      labelWidth: 90,
      valueWidth: 130,
      fontSize: 9,
      boldValue: false,
    });
    leftY = drawLabelValueRow(doc, "Created At", createdAt, leftX, leftY, {
      labelWidth: 90,
      valueWidth: 130,
      fontSize: 8,
      boldValue: false,
    });
    drawDivider(doc, leftX, leftX + columnWidth - 8, leftY + 2);
    leftY += 12;

    drawSectionTitle(doc, "Customer", leftX, leftY);
    leftY += 24;
    leftY = drawLabelValueRow(
      doc,
      "Name",
      customer?.name ||
        `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim(),
      leftX,
      leftY
    );
    leftY = drawLabelValueRow(doc, "Phone", customer?.phone || "", leftX, leftY);
    leftY = drawLabelValueRow(doc, "Email", customer?.email || "", leftX, leftY);
    drawDivider(doc, leftX, leftX + columnWidth - 8, leftY + 2);
    leftY += 12;

    drawSectionTitle(doc, "Event", leftX, leftY);
    leftY += 24;
    leftY = drawLabelValueRow(doc, "Date", event?.date || "", leftX, leftY);
    leftY = drawLabelValueRow(doc, "Time", event?.time || "", leftX, leftY);
    leftY = drawLabelValueRow(
      doc,
      "Guests",
      event?.guestCount || 0,
      leftX,
      leftY
    );
    leftY = drawLabelValueRow(
      doc,
      "Adults",
      event?.adultCount || 0,
      leftX,
      leftY
    );
    leftY = drawLabelValueRow(doc, "Kids", event?.kidCount || 0, leftX, leftY);

    leftY = drawWrappedBlock(
      doc,
      "Address",
      fullAddress || "Not provided",
      leftX,
      leftY + 4,
      columnWidth - 8,
      {
        titleSize: 10,
        valueSize: 10,
        gapAfterTitle: 2,
        gapAfterBlock: 10,
      }
    );

    drawDivider(doc, leftX, leftX + columnWidth - 8, leftY + 2);
    leftY += 12;

    drawSectionTitle(doc, "Pricing Breakdown", rightX, rightY);
    rightY += 24;
    rightY = drawLabelValueRow(
      doc,
      "Package",
      pricing?.packageName || "",
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Adult Subtotal",
      money(pricing?.adultSubtotal || 0),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Kid Subtotal",
      money(pricing?.kidSubtotal || 0),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Add-Ons Total",
      money(pricing?.addOnTotal || 0),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Protein Upgrade",
      money(pricing?.proteinUpgradeTotal || 0),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Travel Miles",
      `${pricing?.travelMiles || 0} mi`,
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Travel Fee",
      money(pricing?.travelFee || 0),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Sub Before Disc.",
      money(subtotalBeforeDiscount),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Birthday Disc.",
      `-${money(birthdayDiscount)}`,
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Promo Disc.",
      `-${money(promoDiscount)}`,
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Discounted Sub",
      money(discountedSubtotal),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Estimated Tax",
      money(tax),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Total Price",
      money(totalPrice),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
        valueColor: "#0f172a",
      }
    );

    drawDivider(doc, rightX, rightX + columnWidth - 8, rightY + 2);
    rightY += 12;

    drawSectionTitle(doc, "Deposit", rightX, rightY);
    rightY += 24;
    rightY = drawLabelValueRow(
      doc,
      "Deposit Amt",
      money(depositAmount),
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "Status",
      depositStatusText,
      rightX,
      rightY,
      {
        labelWidth: 100,
        valueWidth: 116,
        valueColor: depositPaid ? "#15803d" : "#b91c1c",
      }
    );

    if (depositPaid) {
      rightY = drawLabelValueRow(
        doc,
        "Remaining",
        money(remainingAfterDeposit),
        rightX,
        rightY,
        {
          labelWidth: 100,
          valueWidth: 116,
        }
      );
    }

    drawDivider(doc, rightX, rightX + columnWidth - 8, rightY + 2);
    rightY += 12;

    drawSectionTitle(doc, "Suggested Gratuity", rightX, rightY);
    rightY += 24;
    rightY = drawLabelValueRow(
      doc,
      "18%",
      `${money(gratuity18)}  | Total ${money(totalPrice + gratuity18)}`,
      rightX,
      rightY,
      {
        labelWidth: 42,
        valueWidth: 174,
        boldValue: false,
        fontSize: 9,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "20%",
      `${money(gratuity20)}  | Total ${money(totalPrice + gratuity20)}`,
      rightX,
      rightY,
      {
        labelWidth: 42,
        valueWidth: 174,
        boldValue: false,
        fontSize: 9,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "25%",
      `${money(gratuity25)}  | Total ${money(totalPrice + gratuity25)}`,
      rightX,
      rightY,
      {
        labelWidth: 42,
        valueWidth: 174,
        boldValue: false,
        fontSize: 9,
      }
    );
    rightY = drawLabelValueRow(
      doc,
      "30%",
      `${money(gratuity30)}  | Total ${money(totalPrice + gratuity30)}`,
      rightX,
      rightY,
      {
        labelWidth: 42,
        valueWidth: 174,
        boldValue: false,
        fontSize: 9,
      }
    );

    const bodyStartY = Math.max(leftY, rightY) + 14;

    drawDivider(doc, leftX, pageWidth - 42, bodyStartY - 8);

    let bodyY = bodyStartY;

    drawSectionTitle(doc, "Selections", leftX, bodyY);
    bodyY += 22;

    bodyY = drawWrappedBlock(
      doc,
      "Meal Decision",
      mealDecisionText,
      leftX,
      bodyY,
      pageWidth - 84,
      {
        titleSize: 10,
        valueSize: 10,
        valueFont: "Helvetica",
        gapAfterBlock: 8,
      }
    );

    bodyY = drawWrappedBlock(
      doc,
      "Adult Proteins",
      adultProteins,
      leftX,
      bodyY,
      pageWidth - 84,
      {
        titleSize: 10,
        valueSize: 10,
        gapAfterBlock: 8,
      }
    );

    bodyY = drawWrappedBlock(
      doc,
      "Kid Proteins",
      kidProteins,
      leftX,
      bodyY,
      pageWidth - 84,
      {
        titleSize: 10,
        valueSize: 10,
        gapAfterBlock: 8,
      }
    );

    bodyY = drawWrappedBlock(
      doc,
      "Add-Ons Details",
      addOnsDetails,
      leftX,
      bodyY,
      pageWidth - 84,
      {
        titleSize: 10,
        valueSize: 10,
        gapAfterBlock: 10,
      }
    );

    drawDivider(doc, leftX, pageWidth - 42, bodyY);
    bodyY += 10;

    const extraLeftX = leftX;
    const extraRightX = 326;
    let extraLeftY = bodyY;
    let extraRightY = bodyY;

    drawSectionTitle(doc, "Additional Information", extraLeftX, extraLeftY);
    extraLeftY += 22;
    extraLeftY = drawLabelValueRow(
      doc,
      "Promo Code",
      promoCode,
      extraLeftX,
      extraLeftY,
      {
        labelWidth: 95,
        valueWidth: 120,
        boldValue: false,
        fontSize: 9,
      }
    );
    extraLeftY = drawLabelValueRow(
      doc,
      "Birth Month",
      shared?.birthday?.month || "Not provided",
      extraLeftX,
      extraLeftY,
      {
        labelWidth: 95,
        valueWidth: 120,
        boldValue: false,
        fontSize: 9,
      }
    );
    extraLeftY = drawLabelValueRow(
      doc,
      "Birth Day",
      shared?.birthday?.day || "Not provided",
      extraLeftX,
      extraLeftY,
      {
        labelWidth: 95,
        valueWidth: 120,
        boldValue: false,
        fontSize: 9,
      }
    );
    extraLeftY = drawLabelValueRow(
      doc,
      "Birth Year",
      shared?.birthday?.year || "Not provided",
      extraLeftX,
      extraLeftY,
      {
        labelWidth: 95,
        valueWidth: 120,
        boldValue: false,
        fontSize: 9,
      }
    );
    extraLeftY = drawLabelValueRow(
      doc,
      "Heard About Us",
      heardAboutText,
      extraLeftX,
      extraLeftY,
      {
        labelWidth: 95,
        valueWidth: 120,
        boldValue: false,
        fontSize: 9,
      }
    );

    extraLeftY = drawWrappedBlock(
      doc,
      "Special Requests",
      specialRequestsText,
      extraLeftX,
      extraLeftY + 4,
      220,
      {
        titleSize: 9,
        valueSize: 9,
        valueFont: "Helvetica",
        gapAfterBlock: 8,
      }
    );

    extraLeftY = drawWrappedBlock(
      doc,
      "Notes",
      notesText,
      extraLeftX,
      extraLeftY,
      220,
      {
        titleSize: 9,
        valueSize: 9,
        valueFont: "Helvetica",
        gapAfterBlock: 0,
      }
    );

    drawSectionTitle(doc, "Allergies / Dietary Alert", extraRightX, extraRightY);
    extraRightY += 22;
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#dc2626")
      .text(allergiesText, extraRightX, extraRightY, {
        width: 220,
      });

    extraRightY = doc.y + 12;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111111")
      .text("Operational Notes", extraRightX, extraRightY, {
        width: 220,
      });

    extraRightY = doc.y + 6;

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#666666")
      .text(
        "This invoice was generated by ShuiLink Booking Engine. Deposit payment, staff follow-up, and final confirmation may occur after this request is reviewed.",
        extraRightX,
        extraRightY,
        {
          width: 220,
          lineGap: 1,
        }
      );

    const footerY = Math.max(extraLeftY, doc.y) + 10;

    if (footerY > contentBottomLimit) {
      doc.addPage({
        size: "LETTER",
        margin: 0,
      });

      doc.rect(0, 0, pageWidth, headerHeight).fill("#0b1635");
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("Hibachi Booking Invoice", 0, 24, {
          width: pageWidth,
          align: "center",
        });

      let overflowY = 96;

      drawSectionTitle(doc, "Overflow Notes", leftX, overflowY);
      overflowY += 24;

      overflowY = drawWrappedBlock(
        doc,
        "Adult Proteins",
        adultProteins,
        leftX,
        overflowY,
        pageWidth - 84
      );
      overflowY = drawWrappedBlock(
        doc,
        "Kid Proteins",
        kidProteins,
        leftX,
        overflowY,
        pageWidth - 84
      );
      overflowY = drawWrappedBlock(
        doc,
        "Add-Ons Details",
        addOnsDetails,
        leftX,
        overflowY,
        pageWidth - 84
      );
      overflowY = drawWrappedBlock(
        doc,
        "Special Requests",
        specialRequestsText,
        leftX,
        overflowY,
        pageWidth - 84
      );
      overflowY = drawWrappedBlock(
        doc,
        "Notes",
        notesText,
        leftX,
        overflowY,
        pageWidth - 84
      );
      overflowY = drawWrappedBlock(
        doc,
        "Allergies / Dietary Alert",
        allergiesText,
        leftX,
        overflowY,
        pageWidth - 84,
        {
          titleColor: "#b91c1c",
          valueColor: "#dc2626",
          titleFont: "Helvetica-Bold",
          valueFont: "Helvetica-Bold",
        }
      );
    }

    doc.end();
  });
}

module.exports = { generateInvoiceBuffer };