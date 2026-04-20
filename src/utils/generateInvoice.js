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

// 🔥 更紧凑 row（不再使用 doc.y）
function drawRow(doc, label, value, x, y) {
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#444")
    .text(label, x, y);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111")
    .text(String(value ?? ""), x + 120, y, {
      width: 140,
      align: "right",
    });
}

function generateInvoiceBuffer(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 40,
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

    const depositStatusText = depositPaid ? "PAID" : "NOT PAID";

    const remainingAfterDeposit = Math.max(0, totalPrice - depositAmount);

    const allergiesText =
      Array.isArray(food?.allergies) && food.allergies.length > 0
        ? food.allergies.join(", ")
        : "None provided";

    // ================= HEADER =================
    doc.rect(0, 0, 612, 70).fill("#0f172a");

    doc
      .fillColor("#fff")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Hibachi Booking Invoice", 50, 25, { align: "center" });

    doc.fillColor("#111");

    // ================= LAYOUT =================
    const leftX = 55;
    const rightX = 320;

    let yLeft = 100;
    let yRight = 100;

    // 🔥 中间分割线
    doc
      .strokeColor("#dddddd")
      .lineWidth(1)
      .moveTo(300, 90)
      .lineTo(300, 700)
      .stroke();

    // ================= LEFT =================

    doc.font("Helvetica-Bold").fontSize(12).text("Customer", leftX, yLeft);
    yLeft += 18;

    drawRow(doc, "Name", customer?.name || "", leftX, yLeft);
    yLeft += 16;
    drawRow(doc, "Phone", customer?.phone || "", leftX, yLeft);
    yLeft += 16;
    drawRow(doc, "Email", customer?.email || "", leftX, yLeft);

    yLeft += 24;

    doc.font("Helvetica-Bold").text("Event", leftX, yLeft);
    yLeft += 18;

    drawRow(doc, "Date", event?.date || "", leftX, yLeft);
    yLeft += 16;
    drawRow(doc, "Time", event?.time || "", leftX, yLeft);
    yLeft += 16;
    drawRow(
      doc,
      "Guests",
      event?.guestCount || 0,
      leftX,
      yLeft
    );

    yLeft += 20;

    doc.font("Helvetica-Bold").text("Selections", leftX, yLeft);
    yLeft += 16;

    doc.fontSize(10).text(`Adults: ${adultProteins}`, leftX, yLeft);
    yLeft += 14;

    doc.text(`Kids: ${kidProteins}`, leftX, yLeft);
    yLeft += 14;

    doc.text(`Add-ons: ${addOnsDetails}`, leftX, yLeft);

    yLeft += 20;

    // 🔴 Allergy（强制红）
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#b91c1c")
      .text("⚠ ALLERGY ALERT", leftX, yLeft);

    yLeft += 14;

    doc
      .font("Helvetica-Bold")
      .fillColor("#dc2626")
      .text(allergiesText, leftX, yLeft, { width: 220 });

    // ================= RIGHT =================

    doc.fillColor("#111");

    doc.font("Helvetica-Bold").fontSize(12).text("Pricing", rightX, yRight);
    yRight += 18;

    drawRow(doc, "Package", pricing?.packageName || "", rightX, yRight);
    yRight += 16;

    drawRow(doc, "Total", money(totalPrice), rightX, yRight);
    yRight += 24;

    doc.font("Helvetica-Bold").text("Deposit", rightX, yRight);
    yRight += 18;

    drawRow(doc, "Deposit", money(depositAmount), rightX, yRight);
    yRight += 16;

    drawRow(doc, "Status", depositStatusText, rightX, yRight);
    yRight += 16;

    if (depositPaid) {
      drawRow(
        doc,
        "Remaining",
        money(remainingAfterDeposit),
        rightX,
        yRight
      );
      yRight += 16;
    }

    yRight += 20;

    doc.font("Helvetica-Bold").text("Gratuity", rightX, yRight);
    yRight += 16;

    doc.font("Helvetica").fontSize(10);

    doc.text(`18% → ${money(totalPrice * 0.18)}`, rightX, yRight);
    yRight += 14;

    doc.text(`20% → ${money(totalPrice * 0.2)}`, rightX, yRight);
    yRight += 14;

    doc.text(`25% → ${money(totalPrice * 0.25)}`, rightX, yRight);

    // ================= FOOTER =================
    doc
      .fontSize(8)
      .fillColor("#666")
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