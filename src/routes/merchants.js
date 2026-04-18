const express = require("express");
const kobeConfig = require("../merchants/kobe/config");

const router = express.Router();

router.get("/:slug", (req, res) => {
  const { slug } = req.params;

  if (slug === "kobe") {
    return res.json({
      success: true,
      merchant: kobeConfig,
    });
  }

  return res.status(404).json({
    success: false,
    error: "Merchant not found",
  });
});

module.exports = router;