// 负责把 booking 数据追加到商家的 Google Sheet 中。

const { googleSheetsClient } = require("./googleSheetsClient");

async function appendBookingRow({
  spreadsheetId,
  sheetName = "Bookings",
  rowData,
}) {
  try {
    await googleSheetsClient.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    console.log("✅ Booking row appended to Google Sheet");
  } catch (error) {
    console.error("❌ Failed to append booking row:", error.message);
    throw error;
  }
}

module.exports = {
  appendBookingRow,
};