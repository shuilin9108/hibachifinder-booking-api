// 负责校验后台用户身份，并根据邮箱识别 platform_admin / merchant_owner / staff / chef 权限。
const jwt = require("jsonwebtoken");
const AdminUser = require("../models/AdminUser");
const { getAdminUserByEmail } = require("../data/adminUsers");

async function requireAdminUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    let tokenUser = null;

    if (bearerToken) {
      try {
        tokenUser = jwt.verify(
          bearerToken,
          process.env.ADMIN_JWT_SECRET || "dev-admin-secret-change-me",
        );
      } catch (tokenError) {
        console.warn("ADMIN TOKEN VERIFY FAILED, falling back to admin email header:", tokenError.message);
      }
    }

    const adminEmail = String(
      tokenUser?.email ||
        req.headers["x-admin-email"] ||
        req.headers["X-Admin-Email"] ||
        req.query.adminEmail ||
        "",
    ).trim().toLowerCase();

    if (!adminEmail) {
      return res.status(401).json({
        success: false,
        error: "Missing admin credentials",
      });
    }

    // 1. 优先查 MongoDB
    let user = await AdminUser.findOne({ email: adminEmail }).lean();

    // 2. 如果线上 MongoDB 没有这个用户，fallback 到本地白名单
    if (!user) {
      user = getAdminUserByEmail(adminEmail);
    }

    if (!user || user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    req.adminUser = {
      email: user.email,
      name: user.name,
      role: user.role,
      merchantSlugs: user.merchantSlugs || [],
      isActive: user.isActive !== false,
    };

    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Auth failed",
      details: err.message,
    });
  }
}

module.exports = { requireAdminUser };