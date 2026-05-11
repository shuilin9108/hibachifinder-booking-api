import express from "express";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();

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
          name,
          phone,
          authProvider: "email",
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    const token = jwt.sign(
      {
        customerId: customer._id,
        email: customer.email,
        role: "customer",
      },
      process.env.CUSTOMER_JWT_SECRET || "dev-customer-secret-change-me",
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      token,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
