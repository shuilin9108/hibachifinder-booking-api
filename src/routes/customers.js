// Customers API：客户账号基础接口，用于未来登录、dashboard、收藏、积分和礼品卡。

import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();

router.get("/by-email", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required.",
      });
    }

    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found.",
      });
    }

    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required.",
      });
    }

    const customer = await Customer.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          email,
          name: req.body.name || "",
          phone: req.body.phone || "",
          authProvider: req.body.authProvider || "email",
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch("/:customerId/favorites", async (req, res) => {
  try {
    const update = {};

    if (Array.isArray(req.body.favoriteMerchantSlugs)) {
      update.favoriteMerchantSlugs = req.body.favoriteMerchantSlugs;
    }

    if (Array.isArray(req.body.favoriteChefIds)) {
      update.favoriteChefIds = req.body.favoriteChefIds;
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.customerId,
      { $set: update },
      { new: true },
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found.",
      });
    }

    res.json({ success: true, customer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
