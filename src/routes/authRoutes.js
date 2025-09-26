// src/routes/authRoutes.js
import { Router } from "express";
import * as ctrl from "../controllers/auth/authController.js";
import * as githubCtrl from "../controllers/auth/githubController.js";

const router = Router();

/**
 * 发送验证码（注册/登录/找回）
 * body: { email, purpose } purpose: register | login | reset
 */
router.post("/send-code", ctrl.sendCode);

/**
 * 注册（使用邮箱验证码）
 * body: { email, code, password, confirmPassword }
 * 返回：{ account } 系统生成的 6~10 位纯数字账号
 */
router.post("/register", ctrl.register);

/**
 * 登录 - 密码（支持 account+password 或 email+password）
 * body: { account?, email?, password }
 */
router.post("/login", ctrl.loginPassword);

/**
 * 快速登录 - 邮箱验证码（email + code）
 * body: { email, code }
 */
router.post("/login-with-code", ctrl.loginWithCode);

/**
 * 发送找回验证码（也可直接用 /send-code?purpose=reset）
 * body: { email }
 */
router.post("/send-reset", ctrl.sendReset);

/**
 * 用验证码重置密码
 * body: { email, code, newPassword, confirmPassword }
 */
router.post("/reset-by-code", ctrl.resetByCode);

/**
 * 已知旧密码改密
 * body: { email, oldPassword, newPassword, confirmPassword }
 */
router.post("/change-with-old", ctrl.changeWithOld);

// GitHub OAuth
router.get("/github/callback", githubCtrl.githubCallback); // 回调
router.post("/github/bind", githubCtrl.bindGitHub);         // 已登录用户绑定
router.post("/github/register", githubCtrl.registerWithGithub); // 新用户注册并绑定
router.get("/github/login", githubCtrl.githubLogin);

export default router;
