// 负责创建 Google Sheets API client，用于操作商家的 Google Sheet。

const { google } = require("googleapis");

const googleAuthClient = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

googleAuthClient.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const googleSheetsClient = google.sheets({
  version: "v4",
  auth: googleAuthClient,
});

module.exports = {
  googleSheetsClient,
};