// 保存商家后台可编辑的配置覆盖项，用来覆盖默认 merchant config。

const mongoose = require("mongoose");

const MerchantSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    business: {
      name: String,
      phone: String,
      email: String,
      website: String,
      logoUrl: String,
      address: String,
      homeBaseLabel: String,
    },

    branding: {
      businessName: String,
      invoiceTitle: String,
      emailSenderName: String,
      logoUrl: String,
      primaryColor: String,
    },

    payments: {
      stripeDepositLink: String,
      depositAmount: Number,
    },

    integrations: {
      googleCalendar: {
        enabled: Boolean,
        calendarId: String,
      },
      googleSheets: {
        enabled: Boolean,
        spreadsheetId: String,
        sheetName: String,
      },
      resend: {
        enabled: Boolean,
        fromEmail: String,
        merchantNotificationEmail: String,
      },
    },

    notifications: {
      fromEmail: String,
      merchantEmails: [String],
    },

    redirects: {
      thankYouRedirectUrl: String,
    },

    settings: {
      isActive: {
        type: Boolean,
        default: true,
      },
      trialEndsAt: Date,
      monthlyPlan: {
        type: String,
        default: "starter_27",
      },
    },

    updatedBy: String,
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.Merchant || mongoose.model("Merchant", MerchantSchema);