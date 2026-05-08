// 负责处理 booking 创建后的业务流程，例如保存订单、写入 Google Sheet、创建 Calendar event 和发送邮件。

import { createBooking } from "../core/bookings/createBooking.js";
import { bookingSheetMapper } from "../core/bookings/bookingSheetMapper.js";
import { appendBookingRow } from "../integrations/sheets/appendBookingRow.js";

export async function createBookingService({ bookingData, merchantConfig }) {
  const booking = await createBooking({
    bookingData,
    merchantConfig,
  });

  const spreadsheetId =
    merchantConfig?.integrations?.googleSheets?.spreadsheetId ||
    merchantConfig?.googleSheets?.spreadsheetId ||
    merchantConfig?.sheetId;

  if (spreadsheetId) {
    const rowData = bookingSheetMapper({
      booking,
      merchant: merchantConfig,
      pricing: booking.pricing || booking.priceSnapshot || {},
    });

    await appendBookingRow({
      spreadsheetId,
      sheetName: "Bookings",
      rowData,
    });
  } else {
    console.warn("⚠️ No Google Sheet spreadsheetId found for merchant");
  }

  return booking;
}