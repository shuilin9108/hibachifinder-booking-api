// 处理 Google 登录：验证 Google Token → 查询 MongoDB 用户 → 返回角色与权限

const { verifyGoogleIdToken } = require("../services/googleAuthService");
const {
  findAdminUserByEmail,
  buildPermissions,
} = require("../services/adminUserService");

// 👉 假设你已经有 db（后面我可以帮你接 Mongo）
 // 如果没有这个，我们下一步补

async function googleLogin(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Missing credential" });
    }

    // 1️⃣ 验证 Google Token
    const googleUser = await verifyGoogleIdToken(credential);

const adminUser = await findAdminUserByEmail(googleUser.email);

    if (!adminUser) {
      return res.status(403).json({
        message: "Access denied. You are not an authorized admin user.",
      });
    }

    // 4️⃣ 构建权限
    const permissions = buildPermissions(adminUser);

    // 5️⃣ 返回前端
    return res.json({
      user: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        merchantSlugs: adminUser.merchantSlugs,
        platformUserId: adminUser.platformUserId,
        permissions,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);

    return res.status(500).json({
      message: "Authentication failed",
    });
  }
}

module.exports = {
  googleLogin,
};