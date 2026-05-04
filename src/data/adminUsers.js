// 定义后台登录用户、角色和商家权限，MVP 阶段先用白名单配置。

const adminUsers = [
  {
    email: "shuilin9108@gmail.com",
    role: "platform_admin",
    merchantSlugs: ["*"],
    name: "Shui Lin",
  },
  {
    email: "admin@shuilink.com",
    role: "platform_admin",
    merchantSlugs: ["*"],
    name: "ShuiLink Admin",
  },
  {
    email: "hibachifinder@gmail.com",
    role: "platform_admin",
    merchantSlugs: ["*"],
    name: "HibachiFinder Admin",
  },

  {
    email: "a1hibachiparty@gmail.com",
    role: "merchant_owner",
    merchantSlugs: ["a1hibachiparty"],
    name: "A1 Hibachi Party Owner",
  },
  {
    email: "yuangao202121@gmail.com",
    role: "merchant_staff",
    merchantSlugs: ["a1hibachiparty"],
    name: "A1 Hibachi Party Staff",
  },
  {
    email: "shuilin0823@gmail.com",
    role: "assigned_chef",
    merchantSlugs: ["a1hibachiparty"],
    name: "A1 Hibachi Party Chef",
  },

  {
    email: "kobehibachicatering@gmail.com",
    role: "merchant_owner",
    merchantSlugs: ["kobe"],
    name: "Kobe Hibachi Owner",
  },
  {
    email: "zjxinnn@gmail.com",
    role: "merchant_staff",
    merchantSlugs: ["kobe"],
    name: "Kobe Hibachi Staff",
  },
  {
    email: "jasonzheng2016@gmail.com",
    role: "merchant_staff",
    merchantSlugs: ["kobe"],
    name: "Kobe Hibachi Staff",
  },
  {
    email: "shui.lin@stonybrook.edu",
    role: "assigned_chef",
    merchantSlugs: ["kobe"],
    name: "Kobe Hibachi Chef",
  },

  {
    email: "hibachinearby@gmail.com",
    role: "merchant_owner",
    merchantSlugs: ["hibachinearby"],
    name: "HibachiNearby Owner",
  },
  {
    email: "2235869122@qq.com",
    role: "merchant_staff",
    merchantSlugs: ["hibachinearby"],
    name: "HibachiNearby Staff",
  },
  {
    email: "274530127@qq.com",
    role: "assigned_chef",
    merchantSlugs: ["hibachinearby"],
    name: "HibachiNearby Chef",
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

  if (user.role === "platform_admin") return true;

  return user.merchantSlugs.includes(merchantSlug);
}

module.exports = {
  adminUsers,
  getAdminUserByEmail,
  canAccessMerchant,
};