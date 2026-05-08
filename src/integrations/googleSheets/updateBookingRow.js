// updateBookingRow.js 是用来更新 Google Sheet 里面已有 booking 行数据的。

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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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

async function updateBookingRow({ booking, merchant, rowNumber }) {
  const sheetsConfig = getSheetsConfig(merchant);

  if (sheetsConfig.enabled === false) {
    return {
      success: false,
      skipped: true,
      reason: "google_sheets_disabled",
    };
  }

  if (!rowNumber) {
    throw new Error("Missing rowNumber for Google Sheets update.");
  }

  const spreadsheetId = sheetsConfig.spreadsheetId;

  if (!spreadsheetId) {
    throw new Error("Missing spreadsheetId.");
  }

  const sheetName = sheetsConfig.sheetName || "Bookings";

  const accessToken = await getGoogleAccessToken();

  const rowValues = [buildSheetRow(booking)];

  const range = `${sheetName}!A${rowNumber}:AF${rowNumber}`;

  const url = `${GOOGLE_SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(
    range,
  )}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: rowValues,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Google Sheets update failed: ${data.error?.message || response.status}`,
    );
  }

  return {
    success: true,
    provider: "google_sheets",
    spreadsheetId,
    updatedRange: data.updatedRange || "",
    updatedRows: data.updatedRows || 0,
    result: data,
  };
}

module.exports = {
  updateBookingRow,
};
