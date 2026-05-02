// 统一注册所有商家配置，未来新增商家只需要在这里注册。

const kobeConfig = require("../../merchants/kobe/config");
const a1hibachipartyConfig = require("../../merchants/a1hibachiparty/config");
const hibachinearbyConfig = require("../../merchants/hibachinearby/config");
const ezhibachiConfig = require("../../merchants/ezhibachi/config");
const happyhibachicateringConfig = require("../../merchants/happyhibachicatering/config");
const hibachiByShuilinkConfig = require("../../merchants/hibachi-by-shuilink/config");

const merchantsRegistry = {
  kobe: kobeConfig,
  a1hibachiparty: a1hibachipartyConfig,
  hibachinearby: hibachinearbyConfig,
  ezhibachi: ezhibachiConfig,
  happyhibachicatering: happyhibachicateringConfig,
  "hibachi-by-shuilink": hibachiByShuilinkConfig,
};

function getMerchantBySlug(slug) {
  if (!slug) return null;

  return merchantsRegistry[slug] || null;
}

function getAllMerchants() {
  return Object.values(merchantsRegistry);
}

module.exports = {
  merchantsRegistry,
  getMerchantBySlug,
  getAllMerchants,
};