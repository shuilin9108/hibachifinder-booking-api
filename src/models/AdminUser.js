const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },

    name: { type: String },

    role: {
      type: String,
      enum: [
        "platform_admin",
        "merchant_owner",
        "merchant_staff",
        "assigned_chef",
        "customer",
        "advertiser",
        "affiliate_partner",
        "finance_manager",
        "support_agent",
        "readonly_viewer",
      ],
      default: "merchant_staff",
    },

    merchantSlugs: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminUser", AdminUserSchema);