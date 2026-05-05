// 用于从 MongoDB Atlas 查询后台用户，并根据角色构建平台/商家/员工/厨师权限

const AdminUser = require("../models/AdminUser");

async function findAdminUserByEmail(email) {
  if (!email) return null;

  const user = await AdminUser.findOne({
    email: String(email).trim().toLowerCase(),
    isActive: true,
  }).lean();

  if (!user) return null;

  return {
    id: String(user._id),
    email: user.email,
    name: user.name || "",
    role: user.role,
    merchantSlugs: user.merchantSlugs || [],
    platformUserId: user.platformUserId,
    isActive: user.isActive !== false,
  };
}

function buildPermissions(user) {
  if (!user) return [];

  switch (user.role) {
    case "platform_admin":
      return [
        "orders:read",
        "orders:update",
        "orders:delete",
        "platform:manage",
        "merchant:manage",
        "users:manage",
        "reports:read",
      ];

    case "merchant_owner":
      return [
        "orders:read",
        "orders:update",
        "merchant:manage",
        "users:manage",
        "reports:read",
      ];

    case "merchant_staff":
      return ["orders:read", "orders:update"];

    case "assigned_chef":
      return ["orders:read"];

    case "support_agent":
      return ["orders:read", "orders:update"];

    case "readonly_viewer":
      return ["orders:read"];

    default:
      return [];
  }
}

module.exports = {
  findAdminUserByEmail,
  buildPermissions,
};