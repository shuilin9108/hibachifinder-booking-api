// 定义后台登录用户、角色和商家权限，MVP 阶段先用白名单配置。

const adminUsers = [
  {
    email: "shuilin9108@gmail.com",
    role: "admin",
    merchantSlugs: ["*"],
    name: "Shui Lin",
  },
  {
    email: "admin@shuilink.com",
    role: "admin",
    merchantSlugs: ["*"],
    name: "ShuiLink Admin",
  },

  {
    email: "a1hibachiparty@gmail.com",
    role: "owner",
    merchantSlugs: ["a1hibachiparty"],
    name: "A1 Hibachi Party Owner",
  },
  {
    email: "kobehibachicatering@gmail.com",
    role: "owner",
    merchantSlugs: ["kobe"],
    name: "Kobe Hibachi Owner",
  },
  {
    email: "hibachinearby@gmail.com",
    role: "owner",
    merchantSlugs: ["hibachinearby"],
    name: "HibachiNearby Owner",
  },
];

function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

function getAdminUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  return (
    adminUsers.find(
      (user) => normalizeEmail(user.email) === normalizedEmail
    ) || null
  );
}

function canAccessMerchant(user, merchantSlug) {
  if (!user || !merchantSlug) return false;

  if (user.role === "admin") return true;

  return user.merchantSlugs.includes(merchantSlug);
}

module.exports = {
  adminUsers,
  getAdminUserByEmail,
  canAccessMerchant,
};