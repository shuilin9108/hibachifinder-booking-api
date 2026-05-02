const express = require("express");
const router = express.Router();

// ⚠️ Stripe 需要 raw body
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const event = JSON.parse(req.body.toString());

      console.log("🔥 STRIPE EVENT:", event.type);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        const bookingId = session.metadata?.bookingId;

        if (!bookingId) {
          console.log("❌ No bookingId in metadata");
          return res.json({ received: true });
        }

        // 👉 更新数据库（你要改这里）
        const Booking = require("../models/Booking");

        const booking = await Booking.findOne({ bookingId });

        if (!booking) {
          console.log("❌ Booking not found");
          return res.json({ received: true });
        }

        // 判断金额（deposit or full）
        const amount = session.amount_total / 100;

        if (amount <= 100) {
          booking.payment.status = "deposit_paid";
          booking.payment.depositStatus = "paid";
        } else {
          booking.payment.status = "paid_full";
          booking.payment.depositStatus = "paid";
        }

        await booking.save();

        console.log("✅ Payment updated:", bookingId);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook error:", err.message);
      res.status(400).send("Webhook error");
    }
  }
);

module.exports = router;