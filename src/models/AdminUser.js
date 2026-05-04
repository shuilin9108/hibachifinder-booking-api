const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema(
  {
    platformUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

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
    },

    role: {
      type: String,
      enum: [
        "platform_admin",
        "merchant_owner",
        "merchant_staff",
        "assigned_chef",
        "independent_chef",
        "customer",
        "guest",
        "advertiser",
        "affiliate_partner",
        "finance_manager",
        "support_agent",
        "readonly_viewer",
      ],
      default: "merchant_staff",
      index: true,
    },

    merchantSlugs: {
      type: [String],
      default: [],
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);