// 负责校验后台用户身份，并根据邮箱识别 admin / owner / staff 权限。

const { getAdminUserByEmail } = require("../data/adminUsers");

function requireAdminUser(req, res, next) {
  const email =
    req.headers["x-admin-email"] ||
    req.query.adminEmail ||
    req.body?.adminEmail ||
    "";

  const user = getAdminUserByEmail(email);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized admin user.",
    });
  }

  req.adminUser = user;
  next();
}

module.exports = {
  requireAdminUser,
};