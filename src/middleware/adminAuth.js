// 负责校验后台用户身份，并根据邮箱识别 admin / owner / staff 权限。
const AdminUser = require("../models/AdminUser");

async function requireAdminUser(req, res, next) {
  try {
    const adminEmail = String(req.query.adminEmail || "").trim().toLowerCase();

    if (!adminEmail) {
      return res.status(401).json({
        success: false,
        error: "Missing adminEmail",
      });
    }

    const user = await AdminUser.findOne({ email: adminEmail });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Auth failed",
    });
  }
}

module.exports = { requireAdminUser };