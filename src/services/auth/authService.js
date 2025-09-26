// src/services/authService.js
import pool from "../../db.js";
import { hashPassword, comparePassword, randomNumericAccount } from "../../utils/crypto.js";
import { sendEmail } from "../../utils/mailer.js";
import { generateToken } from "../../utils/jwt.js";
import { config } from "../../config.js";

/**
 * Helper: 生成 n 位数字验证码（6 位常用）
 */
const genVerificationCode = (n = 6) => {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
};

/**
 * Helper: 保存验证码到 DB
 */
const saveEmailCode = async ({ email, code, purpose, ttlSeconds = 600 }) => {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await pool.query(
    "INSERT INTO email_codes (email, code, purpose, expires_at, used) VALUES (?,?,?,?,0)",
    [email, code, purpose, expiresAt]
  );
};

/**
 * 发送验证码（供前端：注册验证、快速登录、找回密码）
 * purpose: 'register' | 'login' | 'reset'
 */
export const sendEmailCode = async ({ email, purpose }) => {
  if (!["register", "login", "reset"].includes(purpose)) {
    throw new Error("purpose 参数不合法");
  }

  // 可加速率限制逻辑（略）——建议在真实环境加入速率限制
  const code = genVerificationCode(6);
  await saveEmailCode({ email, code, purpose, ttlSeconds: 10 * 60 }); // 10 分钟有效

  const subject =
    purpose === "register"
      ? "注册验证码"
      : purpose === "login"
      ? "快速登录验证码"
      : "找回密码验证码";

  const html = `<p>您的验证码：<b>${code}</b>，${10}分钟内有效。</p>`;

  await sendEmail({ to: email, subject, html, text: `验证码：${code}` });

  return { message: "验证码已发送，请查收邮箱" };
};

/**
 * 验证邮件验证码是否有效并标记为已用（一次性）
 */
const consumeValidCode = async ({ email, code, purpose }) => {
  const [rows] = await pool.query(
    "SELECT id, used, expires_at FROM email_codes WHERE email=? AND code=? AND purpose=? ORDER BY created_at DESC LIMIT 1",
    [email, code, purpose]
  );
  if (!rows.length) throw new Error("验证码无效");
  const rec = rows[0];
  if (rec.used) throw new Error("验证码已被使用");
  const now = new Date();
  if (now > new Date(rec.expires_at)) throw new Error("验证码已过期");

  // 标记为已用
  await pool.query("UPDATE email_codes SET used=1 WHERE id=?", [rec.id]);
  return true;
};

/**
 * 生成唯一 numeric account（6~10 位），最多尝试若干次
 */
const genUniqueAccount = async () => {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const acc = randomNumericAccount(); // 6~10 位随机
    const [rows] = await pool.query("SELECT id FROM users WHERE account = ? LIMIT 1", [acc]);
    if (!rows.length) return acc;
  }
  throw new Error("未能生成唯一账号，请重试");
};

/**
 * 注册流程（使用邮箱验证码）
 * input: { email, code, password, confirmPassword }
 */
export const registerByEmail = async ({ email, code, password, confirmPassword }) => {
  if (!email || !code || !password || !confirmPassword) throw new Error("参数不完整");
  if (password !== confirmPassword) throw new Error("两次密码不一致");

  // 1. 验证验证码并消耗
  await consumeValidCode({ email, code, purpose: "register" });

  // 2. 检查邮箱是否已被注册
  const [exists] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (exists.length) throw new Error("该邮箱已被注册");

  // 3. 生成唯一数字账号
  const account = await genUniqueAccount();

  // 4. 写用户
  const password_hash = await hashPassword(password);
  await pool.query("INSERT INTO users (account, email, password_hash) VALUES (?,?,?)", [
    account,
    email,
    password_hash,
  ]);

  return { message: "注册成功", account };
};

/**
 * 登录：账号+密码 或 邮箱+密码
 * input: { account?, email?, password }
 */
export const loginWithPassword = async ({ account, email, password }) => {
  if (!password) throw new Error("密码不能为空");

  let rows;
  if (account) {
    [rows] = await pool.query("SELECT * FROM users WHERE account = ? LIMIT 1", [account]);
  } else if (email) {
    [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  } else {
    throw new Error("请输入账号或邮箱");
  }

  if (!rows.length) throw new Error("用户不存在");
  const user = rows[0];
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new Error("密码错误");

  // 生成 JWT 返回（payload 只放必要字段）
  const token = generateToken({ userId: user.id, account: user.account, email: user.email });
  return { token };
};

/**
 * 快速邮箱验证码登录（email + code）
 */
export const loginWithEmailCode = async ({ email, code }) => {
  if (!email || !code) throw new Error("参数缺失");
  await consumeValidCode({ email, code, purpose: "login" });

  // 查用户（必须已注册）
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  if (!rows.length) throw new Error("用户不存在");

  const user = rows[0];
  const token = generateToken({ userId: user.id, account: user.account, email: user.email });
  return { token };
};

/**
 * 通过验证码重置密码（找回）
 * input: { email, code, newPassword, confirmPassword }
 */
export const resetPasswordByCode = async ({ email, code, newPassword, confirmPassword }) => {
  if (!email || !code || !newPassword || !confirmPassword) throw new Error("参数缺失");
  if (newPassword !== confirmPassword) throw new Error("两次密码不一致");

  await consumeValidCode({ email, code, purpose: "reset" });

  const password_hash = await hashPassword(newPassword);
  const [result] = await pool.query("UPDATE users SET password_hash = ? WHERE email = ?", [
    password_hash,
    email,
  ]);
  if (result.affectedRows === 0) throw new Error("用户不存在或修改失败");

  return { message: "密码已重置" };
};

/**
 * 通过旧密码改密（不需要验证码）
 * input: { email, oldPassword, newPassword, confirmPassword }
 */
export const changePasswordWithOld = async ({ email, oldPassword, newPassword, confirmPassword }) => {
  if (!email || !oldPassword || !newPassword || !confirmPassword) throw new Error("参数缺失");
  if (newPassword !== confirmPassword) throw new Error("两次密码不一致");

  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  if (!rows.length) throw new Error("用户不存在");
  const user = rows[0];

  const ok = await comparePassword(oldPassword, user.password_hash);
  if (!ok) throw new Error("旧密码错误");

  const password_hash = await hashPassword(newPassword);
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, user.id]);

  return { message: "密码修改成功" };
};
