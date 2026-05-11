// Review 模型：用于存储客户对 merchant 和 chef 的评价；后续可通过 bookingId 做 verified review。

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewType: {
      type: String,
      enum: ["merchant", "chef"],
      required: true,
      index: true,
    },

    merchantSlug: {
      type: String,
      default: null,
      index: true,
    },

    chefId: {
      type: String,
      default: null,
      index: true,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },

    customerName: {
      type: String,
      default: "Guest Customer",
      trim: true,
    },

    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },

    eventType: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    verified: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "hidden"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ reviewType: 1, merchantSlug: 1, status: 1 });
reviewSchema.index({ reviewType: 1, chefId: 1, status: 1 });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
