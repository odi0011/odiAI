import pool from "../db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";
import { sendEmail } from "../utils/mailer.js";
import { config } from "../config.js";

export const registerUser = async ({ username, email, password }) => {
  // 检查用户名或邮箱是否已存在
  const [exists] = await pool.query(
    "SELECT id FROM users WHERE email=? OR username=?",
    [email, username]
  );
  if (exists.length) throw new Error("用户已存在");

  // 密码加密
  const password_hash = await bcrypt.hash(password, 10);

  // 写入数据库
  const [result] = await pool.query(
    "INSERT INTO users (username, email, password_hash) VALUES (?,?,?)",
    [username, email, password_hash]
  );

  // 生成邮箱验证 JWT
  const token = generateToken({ userId: result.insertId });

  // 生成动态验证链接
  const verifyLink = `${config.app.baseUrl}/api/auth/verify-email?token=${token}`;

  // 发送验证邮件
  await sendEmail({
    to: email,
    subject: "邮箱验证",
    html: `请点击链接验证邮箱：<a href="${verifyLink}">${verifyLink}</a>`,
  });

  return { message: "注册成功，请检查邮箱完成验证" };
};

export const verifyEmail = async (userId) => {
  const [result] = await pool.query(
    "UPDATE users SET email_verified=1 WHERE id=? AND email_verified=0",
    [userId]
  );
  if (result.affectedRows === 0) throw new Error("验证失败或已验证");
  return { message: "邮箱验证成功" };
};

export const loginUser = async ({ email, password }) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE email=?", [email]);
  if (!rows.length) throw new Error("用户不存在");

  const user = rows[0];
  if (!user.email_verified) throw new Error("邮箱未验证");

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error("密码错误");

  // 生成登录 JWT
  const token = generateToken({ userId: user.id });
  return { token };
};