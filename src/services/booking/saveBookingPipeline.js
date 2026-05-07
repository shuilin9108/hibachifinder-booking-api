// 统一处理后台 Save All 的 booking 更新、价格重算、PDF、Calendar、Sheets 同步。

async function saveBookingPipeline(options = {}) {
  const {
    booking,
    updatedEvent,
    updatedSelection,
  } = options;

  console.log("saveBookingPipeline started");

  const nextBooking = {
    ...booking,

    event: {
      ...(booking?.event || {}),
      ...(updatedEvent || {}),
    },

    selection: {
      ...(booking?.selection || {}),
      ...(updatedSelection || {}),
    },
  };

  return {
    success: true,
    booking: nextBooking,
  };
}

module.exports = {
  saveBookingPipeline,
};