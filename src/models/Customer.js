// Customer 模型：用于 HibachiFinder 客户账号、订单历史、收藏、评论、积分和礼品卡。

import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    authProvider: {
      type: String,
      enum: ["email", "google", "guest_upgrade"],
      default: "email",
      index: true,
    },

    favoriteMerchantSlugs: {
      type: [String],
      default: [],
    },

    favoriteChefIds: {
      type: [String],
      default: [],
    },

    rewardPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    giftCardBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Customer =
  mongoose.models.Customer || mongoose.model("Customer", customerSchema);

export default Customer;
