// 🔥 只改布局 + spacing + 字体（逻辑完全不动）

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

// ✅ 更紧凑 row
function drawRow(doc, label, value, options = {}) {
  const {
    labelX = 55,
    valueX = 300, // 🔥 更靠左
    y = doc.y,
    valueColor = "#111111",
    labelColor = "#444444",
    boldValue = true,
  } = options;

  doc
    .font("Helvetica")
    .fontSize(10) // 🔥 缩小字体
    .fillColor(labelColor)
    .text(label, labelX, y, { width: 200 });

  doc
    .font(boldValue ? "Helvetica-Bold" : "Helvetica")
    .fontSize(10)
    .fillColor(valueColor)
    .text(String(value ?? ""), valueX, y, {
      width: 200,
      align: "right",
    });

  doc.moveDown(0.1); // 🔥 减少间距
}

// ✅ 更紧凑 divider
function drawDivider(doc) {
  const y = doc.y + 2;
  doc
    .strokeColor("#dddddd")
    .lineWidth(0.5)
    .moveTo(55, y)
    .lineTo(555, y)
    .stroke();
  doc.moveDown(0.3);
}

function generateInvoiceBuffer(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 40, // 🔥 减少 margin
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

    const totalPrice = Number(pricing?.totalPrice || 0);
    const depositAmount = Number(pricing?.deposit || 50);

    const depositPaid =
      String(payment?.depositStatus || "").toLowerCase() === "paid";

    const remainingAfterDeposit = Math.max(0, totalPrice - depositAmount);

    const allergiesText =
      Array.isArray(food?.allergies) && food.allergies.length > 0
        ? food.allergies.join(", ")
        : "None provided";

    // ================= HEADER =================
    doc.rect(0, 0, 612, 70).fill("#0f172a");
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Hibachi Booking Invoice", 50, 25, { align: "center" });

    doc.fillColor("#111111");

    const leftX = 55;
    const rightX = 310;
    let yLeft = 100;
    let yRight = 100;

    // ================= 左边 =================

    doc.font("Helvetica-Bold").fontSize(12).text("Customer", leftX, yLeft);
    yLeft += 15;

    drawRow(doc, "Name", customer?.name || "", { labelX: leftX, valueX: leftX + 120, y: yLeft });
    yLeft += 14;
    drawRow(doc, "Phone", customer?.phone || "", { labelX: leftX, valueX: leftX + 120, y: yLeft });
    yLeft += 14;
    drawRow(doc, "Email", customer?.email || "", { labelX: leftX, valueX: leftX + 120, y: yLeft });

    yLeft += 18;

    doc.font("Helvetica-Bold").text("Event", leftX, yLeft);
    yLeft += 15;

    drawRow(doc, "Date", event?.date || "", { labelX: leftX, valueX: leftX + 120, y: yLeft });
    yLeft += 14;
    drawRow(doc, "Time", event?.time || "", { labelX: leftX, valueX: leftX + 120, y: yLeft });
    yLeft += 14;
    drawRow(doc, "Guests", event?.guestCount || 0, { labelX: leftX, valueX: leftX + 120, y: yLeft });

    yLeft += 18;

    doc.font("Helvetica-Bold").text("Selections", leftX, yLeft);
    yLeft += 15;

    doc.fontSize(10).text(`Adults: ${adultProteins}`, leftX, yLeft);
    yLeft += 12;
    doc.text(`Kids: ${kidProteins}`, leftX, yLeft);
    yLeft += 12;
    doc.text(`Add-ons: ${addOnsDetails}`, leftX, yLeft);

    yLeft += 16;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#b91c1c")
      .text("⚠ ALLERGY ALERT", leftX, yLeft);

    yLeft += 12;

    doc
      .font("Helvetica-Bold")
      .fillColor("#dc2626")
      .text(allergiesText, leftX, yLeft, { width: 240 });

    // ================= 右边 =================

    doc.fillColor("#111111");

    doc.font("Helvetica-Bold").fontSize(12).text("Pricing", rightX, yRight);
    yRight += 15;

    drawRow(doc, "Package", pricing?.packageName || "", {
      labelX: rightX,
      valueX: rightX + 120,
      y: yRight,
    });

    yRight += 14;

    drawRow(doc, "Total", money(totalPrice), {
      labelX: rightX,
      valueX: rightX + 120,
      y: yRight,
    });

    yRight += 18;

    doc.font("Helvetica-Bold").text("Deposit", rightX, yRight);
    yRight += 15;

    drawRow(doc, "Deposit", money(depositAmount), {
      labelX: rightX,
      valueX: rightX + 120,
      y: yRight,
    });

    yRight += 14;

    drawRow(
      doc,
      "Status",
      depositPaid ? "PAID" : "NOT PAID",
      {
        labelX: rightX,
        valueX: rightX + 120,
        y: yRight,
      }
    );

    if (depositPaid) {
      yRight += 14;
      drawRow(doc, "Remaining", money(remainingAfterDeposit), {
        labelX: rightX,
        valueX: rightX + 120,
        y: yRight,
      });
    }

    yRight += 18;

    doc.font("Helvetica-Bold").text("Gratuity", rightX, yRight);
    yRight += 15;

    doc.fontSize(10).font("Helvetica");

    doc.text(`18% → ${money(totalPrice * 0.18)}`, rightX, yRight);
    yRight += 12;
    doc.text(`20% → ${money(totalPrice * 0.2)}`, rightX, yRight);
    yRight += 12;
    doc.text(`25% → ${money(totalPrice * 0.25)}`, rightX, yRight);

    // ================= FOOTER =================
    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(
        "Generated by ShuiLink Booking Engine",
        55,
        720,
        { width: 500, align: "center" }
      );

    doc.end();
  });
}

module.exports = { generateInvoiceBuffer };