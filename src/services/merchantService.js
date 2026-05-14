// 合并默认商家配置和 MongoDB 后台设置，让 booking engine 可以读取最新商家配置。

const Merchant = require("../models/Merchant");
const AdminUser = require("../models/AdminUser");
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function normalizeChefs(chefs = []) {
  if (!Array.isArray(chefs)) return [];

  const cleaned = chefs
    .map((chef) => ({
      email: normalizeEmail(chef.email),
      platformUserId: String(chef.platformUserId || "").trim(),
      name: String(chef.name || "").trim(),
      status: chef.status || "invited",
      role: chef.role || "merchant_chef",
      profile: {
        displayName: chef.profile?.displayName || chef.name || "",
        avatarUrl: chef.profile?.avatarUrl || "",
        videoUrl: chef.profile?.videoUrl || "",
        reviewUrl: chef.profile?.reviewUrl || "",
        bio: chef.profile?.bio || "",
      },
    }))
    .filter((chef) => chef.email || chef.platformUserId);

  const emails = cleaned.map((chef) => chef.email).filter(Boolean);
  const platformUserIds = cleaned
    .map((chef) => chef.platformUserId)
    .filter(Boolean);

  const matchedUsers = await AdminUser.find({
    $or: [
      emails.length ? { email: { $in: emails } } : null,
      platformUserIds.length ? { platformUserId: { $in: platformUserIds } } : null,
    ].filter(Boolean),
  }).lean();

  const byEmail = new Map(matchedUsers.map((user) => [normalizeEmail(user.email), user]));
  const byPlatformUserId = new Map(
    matchedUsers.map((user) => [user.platformUserId, user]),
  );

  return cleaned.map((chef) => {
    const matchedUser =
      byEmail.get(chef.email) || byPlatformUserId.get(chef.platformUserId);

    return {
      ...chef,
      email: chef.email || normalizeEmail(matchedUser?.email),
      platformUserId: chef.platformUserId || matchedUser?.platformUserId || "",
      name: chef.name || matchedUser?.name || chef.profile.displayName || "",
      status: matchedUser?.isActive ? "active" : chef.status || "invited",
      role: chef.role || "merchant_chef",
      profile: {
        ...chef.profile,
        displayName:
          chef.profile.displayName ||
          chef.name ||
          matchedUser?.name ||
          normalizeEmail(matchedUser?.email) ||
          "",
      },
    };
  });
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

  const finalExtraProteinCatalog =
    Array.isArray(merged.extraProteinCatalog) &&
    merged.extraProteinCatalog.length > 0
      ? merged.extraProteinCatalog
      : defaultConfig.extraProteinCatalog || [];

  const finalAddOns =
    Array.isArray(merged.addOns) && merged.addOns.length > 0
      ? merged.addOns
      : defaultConfig.addOns || [];

  if (merged.branding?.primaryColor) {
    merged.theme = {
      ...(merged.theme || {}),
      primaryColor: merged.branding.primaryColor,
    };
  }

  return {
    ...merged,
    extraProteinCatalog: finalExtraProteinCatalog,
    addOns: finalAddOns,
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
    promotions: updates.promotions || {},
    redirects: updates.redirects || {},
    settings: updates.settings || {},
    chefs: await normalizeChefs(updates.chefs || []),
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
  normalizeChefs,
  upsertMerchantSettings,
};
