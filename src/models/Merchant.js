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

    promotions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    extraProteinCatalog: [
      {
        id: String,
        label: String,
        unitPrice: Number,
        unitLabel: String,
      },
    ],

    chefs: [
      {
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
        platformUserId: {
          type: String,
          trim: true,
        },
        name: String,
        status: {
          type: String,
          enum: ["invited", "active", "inactive"],
          default: "invited",
        },
        role: {
          type: String,
          default: "merchant_chef",
        },
        profile: {
          displayName: String,
          avatarUrl: String,
          videoUrl: String,
          reviewUrl: String,
          bio: String,
        },
      },
    ],

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