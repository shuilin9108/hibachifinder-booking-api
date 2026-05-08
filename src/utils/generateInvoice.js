//generateInvoice.js 是用来根据 booking 数据生成 PDF 账单/订单确认文件的，包括客户信息、活动时间地点、价格明细、路费、定金、小费建议、蛋白选择、过敏信息和备注，然后作为邮件附件发给客户和商家。

const PDFDocument = require("pdfkit");
const getMerchantConfig = require("../core/merchants/getMerchantConfig");

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function safeText(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatProteinMap(map = {}) {
  const result = Object.entries(map || {})
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([name, qty]) => `${name} x${qty}`)
    .join(", ");
  return result || "TBD";
}

function buildCustomerName(customer = {}) {
  return (
    customer?.name ||
    `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
    "Not provided"
  );
}

function buildAddress(address = {}) {
  const parts = [
    address?.street || "",
    address?.city || "",
    address?.state || "",
    address?.zipCode || "",
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Not provided";
}

function formatPaymentStatus(status) {
  switch (status) {
    case "paid_full":
      return "Paid in Full";
    case "deposit_paid":
      return "Deposit Paid";
    default:
      return "Unpaid";
  }
}

function formatBookingStatus(status) {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function drawRoundedBox(doc, x, y, w, h, options = {}) {
  const {
    fillColor = "#ffffff",
    strokeColor = "#e5e7eb",
    radius = 10,
    lineWidth = 1,
  } = options;

  doc.save();
  doc
    .lineWidth(lineWidth)
    .fillColor(fillColor)
    .strokeColor(strokeColor)
    .roundedRect(x, y, w, h, radius)
    .fillAndStroke();
  doc.restore();
}

function drawSectionHeader(doc, text, x, y, w) {
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#111111")
    .text(text, x, y, { width: w, align: "left" });
}

function drawDivider(doc, x, y, w) {
  doc.save();
  doc
    .strokeColor("#e5e7eb")
    .lineWidth(1)
    .moveTo(x, y)
    .lineTo(x + w, y)
    .stroke();
  doc.restore();
}

function drawKeyValue(doc, label, value, x, y, w, options = {}) {
  const {
    fontSize = 8.6,
    labelWidth = 92,
    valueColor = "#111111",
    labelColor = "#6b7280",
    boldValue = true,
    allowMultiline = false,
    valueAlign = "right",
  } = options;

  const valueWidth = w - labelWidth - 8;
  const valueText = safeText(value, "—");

  doc
    .font("Helvetica")
    .fontSize(fontSize)
    .fillColor(labelColor)
    .text(safeText(label), x, y, {
      width: labelWidth,
      lineBreak: false,
    });

  doc
    .font(boldValue ? "Helvetica-Bold" : "Helvetica")
    .fontSize(fontSize)
    .fillColor(valueColor);

  const valueHeight = doc.heightOfString(valueText, {
    width: valueWidth,
    align: valueAlign,
  });

  doc.text(valueText, x + labelWidth + 8, y, {
    width: valueWidth,
    align: valueAlign,
    lineBreak: allowMultiline,
  });

  return allowMultiline ? y + Math.max(13, valueHeight + 5) : y + 13;
}

function drawParagraphBlock(doc, title, value, x, y, w, options = {}) {
  const {
    titleSize = 8.4,
    valueSize = 8.4,
    titleColor = "#6b7280",
    valueColor = "#111111",
    valueFont = "Helvetica-Bold",
    gapAfterTitle = 2,
    gapAfterBlock = 7,
  } = options;

  doc
    .font("Helvetica")
    .fontSize(titleSize)
    .fillColor(titleColor)
    .text(safeText(title), x, y, {
      width: w,
      align: "left",
    });

  const afterTitleY = doc.y + gapAfterTitle;

  doc
    .font(valueFont)
    .fontSize(valueSize)
    .fillColor(valueColor)
    .text(safeText(value, "None"), x, afterTitleY, {
      width: w,
      align: "left",
      lineGap: 0,
    });

  return doc.y + gapAfterBlock;
}

function drawCardTitle(doc, text, x, y, w) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111111")
    .text(text, x, y, { width: w, align: "left" });
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
    const merchant = getMerchantConfig(booking?.merchantSlug || "kobe") || {};
    const business = merchant?.business || {};
    const branding = merchant?.branding || {};

    const invoiceTitle = branding?.invoiceTitle || "Hibachi Booking Invoice";

    const merchantName =
      branding?.businessName || business?.name || "Hibachi Booking";

    const merchantPhone = business?.phone || "";
    const merchantEmail = business?.email || "";

    const bookingId = booking?.bookingId || "";
    const createdAt = booking?.createdAt || "";

    const customerName = buildCustomerName(customer);
    const fullAddress = buildAddress(address);

    const adultCount = Number(event?.adultCount || pricing?.adultCount || 0);
    const kidCount = Number(event?.kidCount || pricing?.kidCount || 0);
    const guestCount = Number(event?.guestCount || adultCount + kidCount);

    const addOnsDetails =
      Object.entries(selection?.addOns || {})
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([name, qty]) => `${name} x${qty}`)
        .join(", ") || "None";

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
    const breakdown = pricing?.pricingBreakdown || {};
    const depositAmount = Number(pricing?.deposit || 50);

    const rawPaymentStatus = payment?.status || "unpaid";

    const paymentStatusText = formatPaymentStatus(rawPaymentStatus);

    const depositPaid =
      rawPaymentStatus === "deposit_paid" ||
      rawPaymentStatus === "paid_full" ||
      String(payment?.depositStatus || "").toLowerCase() === "paid";

    const depositStatusText = depositPaid ? "Paid" : "Unpaid";

    const bookingStatusText = formatBookingStatus(booking?.status);

    const remainingAfterDeposit =
      rawPaymentStatus === "deposit_paid"
        ? Math.max(0, totalPrice - depositAmount)
        : rawPaymentStatus === "paid_full"
          ? 0
          : totalPrice;

    const promoCode = shared?.promoCode || "None";
    const promoDiscount = Number(pricing?.promoCodeDiscount || 0);
    const birthdayDiscount = Number(pricing?.birthdayDiscount || 0);

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

    const pageWidth = 612;
    const leftMargin = 28;
    const rightMargin = 28;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    const gap = 16;
    const colWidth = (contentWidth - gap) / 2;
    const leftX = leftMargin;
    const rightX = leftMargin + colWidth + gap;
    const topY = 78;

    // Header
    doc.rect(0, 0, pageWidth, 58).fill("#0b1635");

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#ffffff")
      .text(invoiceTitle, 0, 14, {
        width: pageWidth,
        align: "center",
      });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#ffffff")
      .text(
        `${merchantName}${merchantPhone ? " | " + merchantPhone : ""}${
          merchantEmail ? " | " + merchantEmail : ""
        }`,
        0,
        38,
        {
          width: pageWidth,
          align: "center",
        },
      );

    // Top summary cards
    const cardH = 142;

    drawRoundedBox(doc, leftX, topY, colWidth, cardH, {
      fillColor: "#ffffff",
      strokeColor: "#e5e7eb",
    });
    drawRoundedBox(doc, rightX, topY, colWidth, cardH, {
      fillColor: "#ffffff",
      strokeColor: "#e5e7eb",
    });

    let y1 = topY + 12;
    drawCardTitle(doc, "Booking Summary", leftX + 12, y1, colWidth - 24);
    y1 += 20;
    y1 = drawKeyValue(
      doc,
      "Booking ID",
      bookingId,
      leftX + 12,
      y1,
      colWidth - 24,
      {
        fontSize: 8.3,
        labelWidth: 82,
        boldValue: false,
      },
    );
    y1 = drawKeyValue(
      doc,
      "Created At",
      createdAt,
      leftX + 12,
      y1,
      colWidth - 24,
      {
        fontSize: 7.2,
        labelWidth: 82,
        boldValue: false,
      },
    );
    y1 += 3;
    drawDivider(doc, leftX + 12, y1, colWidth - 24);
    y1 += 8;
    y1 = drawKeyValue(
      doc,
      "Name",
      customerName,
      leftX + 12,
      y1,
      colWidth - 24,
      {
        fontSize: 8.3,
        labelWidth: 82,
      },
    );
    y1 = drawKeyValue(
      doc,
      "Phone",
      customer?.phone || "",
      leftX + 12,
      y1,
      colWidth - 24,
      {
        fontSize: 8.3,
        labelWidth: 82,
      },
    );
    y1 = drawKeyValue(
      doc,
      "Email",
      customer?.email || "",
      leftX + 12,
      y1,
      colWidth - 24,
      {
        fontSize: 8.3,
        labelWidth: 82,
      },
    );

    let y2 = topY + 12;
    drawCardTitle(doc, "Event", rightX + 12, y2, colWidth - 24);
    y2 += 20;
    y2 = drawKeyValue(
      doc,
      "Date",
      event?.date || "",
      rightX + 12,
      y2,
      colWidth - 24,
      {
        fontSize: 8.3,
        labelWidth: 78,
      },
    );
    y2 = drawKeyValue(
      doc,
      "Time",
      event?.time || "",
      rightX + 12,
      y2,
      colWidth - 24,
      {
        fontSize: 8.3,
        labelWidth: 78,
      },
    );
    y2 = drawKeyValue(
      doc,
      "Guests",
      guestCount,
      rightX + 12,
      y2,
      colWidth - 24,
      {
        fontSize: 8.3,
        labelWidth: 78,
      },
    );
    y2 = drawKeyValue(
      doc,
      "Adults",
      adultCount,
      rightX + 12,
      y2,
      colWidth - 24,
      {
        fontSize: 8.3,
        labelWidth: 78,
      },
    );
    y2 = drawKeyValue(doc, "Kids", kidCount, rightX + 12, y2, colWidth - 24, {
      fontSize: 8.3,
      labelWidth: 78,
    });
    y2 += 2;
    doc
      .font("Helvetica")
      .fontSize(8.3)
      .fillColor("#6b7280")
      .text("Address", rightX + 12, y2, { width: colWidth - 24 });
    doc
      .font("Helvetica-Bold")
      .fontSize(8.3)
      .fillColor("#111111")
      .text(fullAddress, rightX + 12, y2 + 11, {
        width: colWidth - 24,
        lineGap: 0,
      });

    // Pricing + Deposit row
    const row2Y = topY + cardH + 14;
    const priceCardH = 250;
    const depositCardH = 250;

    drawRoundedBox(doc, leftX, row2Y, colWidth, priceCardH);
    drawRoundedBox(doc, rightX, row2Y, colWidth, depositCardH);

    let pY = row2Y + 12;
    drawCardTitle(doc, "Pricing Breakdown", leftX + 12, pY, colWidth - 24);
    pY += 20;

    const priceW = colWidth - 24;
    pY = drawKeyValue(
      doc,
      "Package",
      pricing?.packageName || "",
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Adult Subtotal",
      money(breakdown?.package?.adultSubtotal || 0),
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Kid Subtotal",
      money(breakdown?.package?.kidSubtotal || 0),
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Extra Proteins",
      money(breakdown?.extraProteins?.total || 0),
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Add-Ons Total",
      money(breakdown?.addOns?.total || 0),
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Protein Upgrade",
      money(breakdown?.upgrades?.proteinUpgradeTotal || 0),
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Travel Miles",
      `${breakdown?.travel?.miles || 0} mi`,
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    const travelFeeDisplay =
      pricing?.travelFeeStatus === "manual_review_required" ||
      pricing?.travelFeeModel === "custom_quote" ||
      pricing?.travelFeeModel === "manual_only"
        ? pricing?.travelFeeLabel || "Travel fee will be confirmed later"
        : money(breakdown?.travel?.fee || 0);

    pY = drawKeyValue(
      doc,
      "Travel Fee",
      travelFeeDisplay,
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 7.4,
        labelWidth: 100,
        boldValue: false,
        allowMultiline: true,
        valueAlign: "right",
      },
    );

    pY = drawKeyValue(
      doc,
      "Sub Before Disc.",
      money(breakdown?.totals?.subtotalBeforeDiscount || 0),
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Birthday Disc.",
      `-${money(breakdown?.discounts?.birthdayDiscount || 0)}`,
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Promo Disc.",
      `-${money(breakdown?.discounts?.promoCodeDiscount || 0)}`,
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Discounted Sub",
      money(breakdown?.totals?.subtotal || 0),
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Estimated Tax",
      money(breakdown?.tax?.amount || 0),
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
      },
    );

    pY = drawKeyValue(
      doc,
      "Total Price",
      money(breakdown?.totals?.total || 0),
      leftX + 12,
      pY,
      priceW,
      {
        fontSize: 8.2,
        labelWidth: 100,
        valueColor: "#0f172a",
      },
    );

    let dY = row2Y + 12;
    drawCardTitle(doc, "Deposit + Gratuity", rightX + 12, dY, colWidth - 24);
    dY += 20;

    const depW = colWidth - 24;
    dY = drawKeyValue(
      doc,
      "Deposit Amt",
      money(depositAmount),
      rightX + 12,
      dY,
      depW,
      {
        fontSize: 8.2,
        labelWidth: 92,
      },
    );
    dY = drawKeyValue(
      doc,
      "Booking Status",
      bookingStatusText,
      rightX + 12,
      dY,
      depW,
      {
        fontSize: 8.2,
        labelWidth: 92,
        valueColor: "#111111",
      },
    );

    dY = drawKeyValue(
      doc,
      "Payment Status",
      paymentStatusText,
      rightX + 12,
      dY,
      depW,
      {
        fontSize: 8.2,
        labelWidth: 92,
        valueColor:
          rawPaymentStatus === "deposit_paid" ||
          rawPaymentStatus === "paid_full"
            ? "#15803d"
            : "#b91c1c",
      },
    );

    dY = drawKeyValue(
      doc,
      "Deposit Status",
      depositStatusText,
      rightX + 12,
      dY,
      depW,
      {
        fontSize: 8.2,
        labelWidth: 92,
        valueColor: depositPaid ? "#15803d" : "#b91c1c",
      },
    );
    dY = drawKeyValue(
      doc,
      "Remaining",
      money(remainingAfterDeposit),
      rightX + 12,
      dY,
      depW,
      {
        fontSize: 8.2,
        labelWidth: 92,
      },
    );

    dY += 4;
    drawDivider(doc, rightX + 12, dY, depW);
    dY += 8;

    drawSectionHeader(doc, "Suggested Gratuity", rightX + 12, dY, depW);
    dY += 18;
    dY = drawKeyValue(
      doc,
      "20%",
      `${money(gratuity20)} | Total ${money(totalPrice + gratuity20)}`,
      rightX + 12,
      dY,
      depW,
      {
        fontSize: 7.7,
        labelWidth: 34,
        boldValue: false,
      },
    );
    dY = drawKeyValue(
      doc,
      "25%",
      `${money(gratuity25)} | Total ${money(totalPrice + gratuity25)}`,
      rightX + 12,
      dY,
      depW,
      {
        fontSize: 7.7,
        labelWidth: 34,
        boldValue: false,
      },
    );
    dY = drawKeyValue(
      doc,
      "30%",
      `${money(gratuity30)} | Total ${money(totalPrice + gratuity30)}`,
      rightX + 12,
      dY,
      depW,
      {
        fontSize: 7.7,
        labelWidth: 34,
        boldValue: false,
      },
    );

    dY += 4;
    drawDivider(doc, rightX + 12, dY, depW);
    dY += 8;

    drawSectionHeader(doc, "Allergies / Dietary Alert", rightX + 12, dY, depW);
    dY += 16;

    drawRoundedBox(doc, rightX + 12, dY, depW, 38, {
      fillColor: "#fef2f2",
      strokeColor: "#fecaca",
      radius: 8,
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#dc2626")
      .text(allergiesText, rightX + 20, dY + 12, {
        width: depW - 16,
        align: "left",
      });

    // Selections full width
    const row3Y = row2Y + priceCardH + 10;
    const fullW = contentWidth;
    const selectionsH = 128;

    drawRoundedBox(doc, leftX, row3Y, fullW, selectionsH);

    let sY = row3Y + 12;
    drawCardTitle(doc, "Selections", leftX + 12, sY, fullW - 24);
    sY += 18;

    const threeColGap = 10;
    const threeColW = (fullW - 24 - threeColGap * 2) / 3;
    const blockY = sY + 2;
    const block1X = leftX + 12;
    const block2X = block1X + threeColW + threeColGap;
    const block3X = block2X + threeColW + threeColGap;

    drawParagraphBlock(
      doc,
      "Meal Decision",
      mealDecisionText,
      block1X,
      blockY,
      threeColW,
      {
        titleSize: 8.3,
        valueSize: 8.2,
        valueFont: "Helvetica",
        gapAfterBlock: 0,
      },
    );

    drawParagraphBlock(
      doc,
      "Adult Proteins",
      adultProteins,
      block2X,
      blockY,
      threeColW,
      {
        titleSize: 8.3,
        valueSize: 8.0,
        gapAfterBlock: 0,
      },
    );

    drawParagraphBlock(
      doc,
      "Kid Proteins",
      kidProteins,
      block3X,
      blockY,
      threeColW,
      {
        titleSize: 8.3,
        valueSize: 8.0,
        gapAfterBlock: 0,
      },
    );

    const addOnY = row3Y + 92;
    drawDivider(doc, leftX + 12, addOnY, fullW - 24);
    doc
  .font("Helvetica-Bold")
  .fontSize(8.1)
  .fillColor("#111111")
  .text(addOnsDetails, {
    width: fullW - 106,
    lineBreak: false,
    continued: false,
  });

    doc
      .font("Helvetica-Bold")
      .fontSize(8.1)
      .fillColor("#111111")
      .text(addOnsDetails, {
        width: fullW - 106,
        continued: false,
      });

    // Additional Information + Notes
    const row4Y = row3Y + selectionsH + 10;
    const leftBottomH = 118;
    const rightBottomH = 118;

    drawRoundedBox(doc, leftX, row4Y, colWidth, leftBottomH);
    drawRoundedBox(doc, rightX, row4Y, colWidth, rightBottomH);

    let aY = row4Y + 12;
    drawCardTitle(doc, "Additional Information", leftX + 12, aY, colWidth - 24);
    aY += 20;

    const addInfoW = colWidth - 24;
    aY = drawKeyValue(doc, "Promo Code", promoCode, leftX + 12, aY, addInfoW, {
      fontSize: 8.0,
      labelWidth: 88,
      boldValue: false,
    });
    aY = drawKeyValue(
      doc,
      "Birth Month",
      shared?.birthday?.month || "Not provided",
      leftX + 12,
      aY,
      addInfoW,
      {
        fontSize: 8.0,
        labelWidth: 88,
        boldValue: false,
      },
    );
    aY = drawKeyValue(
      doc,
      "Birth Day",
      shared?.birthday?.day || "Not provided",
      leftX + 12,
      aY,
      addInfoW,
      {
        fontSize: 8.0,
        labelWidth: 88,
        boldValue: false,
      },
    );
    aY = drawKeyValue(
      doc,
      "Birth Year",
      shared?.birthday?.year || "Not provided",
      leftX + 12,
      aY,
      addInfoW,
      {
        fontSize: 8.0,
        labelWidth: 88,
        boldValue: false,
      },
    );
    aY = drawKeyValue(
      doc,
      "Heard About",
      heardAboutText,
      leftX + 12,
      aY,
      addInfoW,
      {
        fontSize: 8.0,
        labelWidth: 88,
        boldValue: false,
      },
    );

    let nY = row4Y + 12;
    drawCardTitle(doc, "Notes", rightX + 12, nY, colWidth - 24);
    nY += 18;

    nY = drawParagraphBlock(
      doc,
      "Special Requests",
      specialRequestsText,
      rightX + 12,
      nY,
      colWidth - 24,
      {
        titleSize: 8.2,
        valueSize: 8.1,
        valueFont: "Helvetica",
        gapAfterBlock: 8,
      },
    );

    nY = drawParagraphBlock(
      doc,
      "Notes",
      notesText,
      rightX + 12,
      nY,
      colWidth - 24,
      {
        titleSize: 8.2,
        valueSize: 8.1,
        valueFont: "Helvetica",
        gapAfterBlock: 10,
      },
    );

    doc
      .font("Helvetica")
      .fontSize(7.4)
      .fillColor("#666666")
      .text(
        "This invoice was generated by ShuiLink Booking Engine. Deposit payment, staff follow-up, and final confirmation may occur after this request is reviewed.",
        rightX + 12,
        row4Y + rightBottomH - 34,
        {
          width: colWidth - 24,
          lineGap: 0,
        },
      );

    doc.end();
  });
}

module.exports = { generateInvoiceBuffer };
