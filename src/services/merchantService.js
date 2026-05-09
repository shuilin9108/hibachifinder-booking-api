// 合并默认商家配置和 MongoDB 后台设置，让 booking engine 可以读取最新商家配置。

const Merchant = require("../models/Merchant");
const getMerchantConfig = require("../core/merchants/getMerchantConfig");

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

function deepMerge(base = {}, override = {}) {
  const result = { ...base };

  Object.keys(override || {}).forEach((key) => {
    const value = override[key];

    if (value === undefined || value === null || value === "") {
      return;
    }

    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key], value);
      return;
    }

    result[key] = value;
  });

  return result;
}

function toCleanObject(doc) {
  if (!doc) return null;

  const raw =
    typeof doc.toObject === "function"
      ? doc.toObject({ depopulate: true })
      : doc;

  const {
    _id,
    __v,
    createdAt,
    updatedAt,
    updatedBy,
    slug,
    settings,
    ...editableConfig
  } = raw;

  return {
    slug,
    settings,
    editableConfig,
    metadata: {
      id: _id?.toString?.() || "",
      createdAt,
      updatedAt,
      updatedBy,
    },
  };
}

async function getMerchantSettings(slug) {
  return Merchant.findOne({ slug }).lean();
}

async function getMergedMerchantConfig(slug) {
  const defaultConfig = getMerchantConfig(slug);

  if (!defaultConfig) {
    return null;
  }

  const settingsDoc = await Merchant.findOne({ slug }).lean();

  if (!settingsDoc) {
    return defaultConfig;
  }

  const cleaned = toCleanObject(settingsDoc);

  const merged = deepMerge(defaultConfig, {
    ...cleaned.editableConfig,
    thankYouRedirectUrl:
      cleaned.editableConfig?.redirects?.thankYouRedirectUrl ||
      defaultConfig.thankYouRedirectUrl,
  });

  return {
    ...merged,
    settings: {
      ...(merged.settings || {}),
      ...(cleaned.settings || {}),
    },
    metadata: cleaned.metadata,
  };
}

async function upsertMerchantSettings({ slug, updates = {}, updatedBy = "" }) {
  const defaultConfig = getMerchantConfig(slug);

  if (!defaultConfig) {
    const error = new Error(`Merchant "${slug}" not found.`);
    error.statusCode = 404;
    throw error;
  }

  const allowedUpdates = {
    business: updates.business || {},
    branding: updates.branding || {},
    payments: updates.payments || {},
    integrations: updates.integrations || {},
    notifications: updates.notifications || {},
    redirects: updates.redirects || {},
    settings: updates.settings || {},
    updatedBy,
  };

  const doc = await Merchant.findOneAndUpdate(
    { slug },
    {
      $set: allowedUpdates,
      $setOnInsert: { slug },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );

  return {
    settings: doc.toObject(),
    merchant: await getMergedMerchantConfig(slug),
  };
}

module.exports = {
  deepMerge,
  getMerchantSettings,
  getMergedMerchantConfig,
  upsertMerchantSettings,
};