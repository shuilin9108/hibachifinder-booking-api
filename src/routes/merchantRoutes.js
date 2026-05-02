const express = require("express");

const kobeConfig = require("../merchants/kobe/config");
const a1Config = require("../merchants/a1hibachiparty/config");
const hibachiNearbyConfig = require("../merchants/hibachinearby/config");

const router = express.Router();

const MERCHANTS = {
  kobe: kobeConfig,
  a1hibachiparty: a1Config,
  hibachinearby: hibachiNearbyConfig,
};

router.get("/merchants/:slug", (req, res) => {
  const { slug } = req.params;

  const merchant = MERCHANTS[slug];

  if (!merchant) {
    return res.status(404).json({
      error: `Merchant "${slug}" not found`,
    });
  }

  res.json({
    merchant,
  });
});

module.exports = router;