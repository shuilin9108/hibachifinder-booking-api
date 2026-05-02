// 根据 merchantSlug 从商家注册表读取对应商家配置。

const { getMerchantBySlug } = require("../../data/merchants");

function normalizeMerchantSlug(slug = "kobe") {
  return String(slug || "kobe")
    .trim()
    .toLowerCase();
}

function getMerchantConfig(slug = "kobe") {
  const normalizedSlug = normalizeMerchantSlug(slug);
  const merchant = getMerchantBySlug(normalizedSlug);

  if (!merchant) {
    return null;
  }

  return merchant;
}

module.exports = getMerchantConfig;