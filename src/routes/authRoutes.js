// 负责处理后台 Google 登录认证接口（/api/auth/google）

const express = require("express");

const { googleLogin } = require("../controllers/authController");

const router = express.Router();

// Google OAuth 登录
router.post("/google", googleLogin);

module.exports = router;