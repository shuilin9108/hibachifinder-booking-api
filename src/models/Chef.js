// Chef 模型：用于存储 HibachiFinder 平台里的商家厨师、自由厨师、评分、语言、特技和可接单状态。

import mongoose from "mongoose";

const chefSchema = new mongoose.Schema(
  {
    chefId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    platformUserId: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    displayName: {
      type: String,
      default: "",
      trim: true,
    },

    photoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    merchantSlug: {
      type: String,
      default: null,
      index: true,
    },

    affiliatedMerchant: {
      type: String,
      default: null,
      index: true,
    },

    independent: {
      type: Boolean,
      default: false,
      index: true,
    },

    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    orderCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    yearsExperience: {
      type: Number,
      default: 0,
      min: 0,
    },

    languages: {
      type: [String],
      default: [],
    },

    specialties: {
      type: [String],
      default: [],
    },

    serviceAreas: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "active",
      index: true,
    },

    profileVisibility: {
      type: String,
      enum: ["public", "private", "hidden"],
      default: "public",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Chef = mongoose.models.Chef || mongoose.model("Chef", chefSchema);

export default Chef;
