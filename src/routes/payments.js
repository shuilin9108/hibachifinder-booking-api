// 处理 Stripe webhook、支付状态同步，以及 deposit payment 更新。

const express = require("express");
const Booking = require("../models/Booking");

const router = express.Router();

router.post("/stripe/webhook", async (req, res) => {
  try {
    console.log("💰 Stripe webhook received");

    const event = req.body;

    // 这里只先做最基础版本
    // 后面再加 Stripe signature verification

    if (event?.type === "checkout.session.completed") {
      const session = event.data.object;

      const bookingId =
        session?.metadata?.bookingId ||
        session?.client_reference_id;

      if (!bookingId) {
        console.warn("⚠️ Missing bookingId in Stripe session");
        return res.status(400).json({
          success: false,
          error: "Missing bookingId",
        });
      }

      const booking = await Booking.findOne({ bookingId });

      if (!booking) {
        console.warn(`⚠️ Booking not found: ${bookingId}`);

        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      booking.payment = {
        ...(booking.payment || {}),
        depositSelected: true,
        depositStatus: "paid",
        stripePaymentStatus: "paid",
        stripeSessionId: session.id,
        depositPaidAt: new Date().toISOString(),
      };

      booking.status = "deposit_paid";
      booking.updatedAt = new Date().toISOString();

      await booking.save();

      console.log(`✅ Deposit marked paid for ${bookingId}`);
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("❌ Stripe webhook error:", error);

    return res.status(500).json({
      success: false,
      error: "Stripe webhook failed",
    });
  }
});

module.exports = router;