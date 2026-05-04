// Booking 数据模型：保存客户提交的订单、活动信息、价格快照、付款状态和商家归属。

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    merchantSlug: {
      type: String,
      required: true,
      index: true,
    },

    customer: {
      type: Object,
      default: {},
    },

    event: {
      type: Object,
      default: {},
    },

    selection: {
      type: Object,
      default: {},
    },

    shared: {
      type: Object,
      default: {},
    },

    food: {
      type: Object,
      default: {},
    },

    merchantSpecific: {
      type: Object,
      default: {},
    },

    assignedChefEmail: {
      type: String,
      default: null,
    },

    pricingSnapshot: {
      type: Object,
      default: {},
    },

    payment: {
      type: Object,
      default: {},
    },

    notes: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "deposit_paid", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);