// appendBookingToSheet.js 是用来把新的 booking 订单追加写入商家的 Google Sheet。

const buildSheetRow = require("./buildSheetRow");

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

async function getGoogleAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth environment variables.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

function getSheetsConfig(merchant = {}) {
  return merchant?.integrations?.googleSheets || {};
}

async function appendBookingToSheet({ booking, merchant }) {
  const sheetsConfig = getSheetsConfig(merchant);

  if (sheetsConfig.enabled === false) {
    return {
      success: false,
      skipped: true,
      reason: "google_sheets_disabled",
    };
  }

  const spreadsheetId = sheetsConfig.spreadsheetId;

  if (!spreadsheetId) {
    return {
      success: false,
      skipped: true,
      reason: "missing_spreadsheet_id",
    };
  }

  const sheetName = sheetsConfig.sheetName || "Bookings";
  const range = `${sheetName}!A:AF`;

  const accessToken = await getGoogleAccessToken();
  const values = [buildSheetRow(booking)];

  const url = `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(
    range,
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Google Sheets append failed: ${data.error?.message || response.status}`,
    );
  }

  return {
    success: true,
    provider: "google_sheets",
    spreadsheetId,
    sheetName,
    updatedRange: data.updates?.updatedRange || "",
    updatedRows: data.updates?.updatedRows || 0,
    result: data,
  };
}

module.exports = {
  appendBookingToSheet,
};
