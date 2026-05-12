const express = require("express");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer").default || require("../models/Customer");
const { verifyGoogleIdToken } = require("../services/googleAuthService");

const router = express.Router();

function signCustomerToken(customer) {
  return jwt.sign(
    {
      customerId: customer._id,
      email: customer.email,
      role: "customer",
    },
    process.env.CUSTOMER_JWT_SECRET || "dev-customer-secret-change-me",
    { expiresIn: "30d" },
  );
}

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

    res.json({
      success: true,
      token: signCustomerToken(customer),
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body || {};

    if (!credential) {
      return res.status(400).json({
        success: false,
        error: "Missing Google credential.",
      });
    }

    const googleUser = await verifyGoogleIdToken(credential);

    const customer = await Customer.findOneAndUpdate(
      { email: googleUser.email },
      {
        $set: {
          name: googleUser.name || "",
          avatarUrl: googleUser.picture || "",
          authProvider: "google",
        },
        $setOnInsert: {
          email: googleUser.email,
          phone: "",
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    res.json({
      success: true,
      token: signCustomerToken(customer),
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
