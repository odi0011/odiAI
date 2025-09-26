import axios from "axios";
import pool from "../../db.js";
import { generateToken } from "../../utils/jwt.js";
import { config } from "../../config.js";


/**
 * 用 code 换取 GitHub access_token
 */
export const getGitHubAccessToken = async (code) => {
  const url = `https://github.com/login/oauth/access_token`;
  const params = {
    client_id: config.github.clientId,
    client_secret: config.github.clientSecret,
    code,
  };
  const headers = { Accept: "application/json" };

  const resp = await axios.post(url, params, { headers });
  if (resp.data.error) throw new Error(resp.data.error_description || "GitHub token 获取失败");
  return resp.data.access_token;
};

/**
 * 用 access_token 获取 GitHub 用户信息
 */
export const getGitHubUser = async (accessToken) => {
  const resp = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });
  return { github_id: resp.data.id.toString(), github_login: resp.data.login, email: resp.data.email };
};

/**
 * GitHub 登录 / 快捷登录
 * 若已绑定账号，返回 JWT；否则返回 { needRegister: true, github_id }
 */
export const loginWithGitHub = async (github_id) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE github_id = ? LIMIT 1", [github_id]);
  if (rows.length) {
    const user = rows[0];
    const token = generateToken({ userId: user.id, account: user.account, email: user.email });
    return { token };
  }
  return { needRegister: true, github_id };
};

/**
 * GitHub 绑定到已登录用户
 * 已登录用户提供 userId，绑定 github_id
 */
export const bindGitHubToUser = async (userId, github_id, github_login) => {
  // 检查是否被其他账号绑定
  const [rows] = await pool.query("SELECT id FROM users WHERE github_id = ? LIMIT 1", [github_id]);
  if (rows.length) throw new Error("该 GitHub 已绑定其他账号");

  // 更新当前用户记录绑定
  await pool.query(
    "UPDATE users SET github_id = ?, github_login = ? WHERE id = ?",
    [github_id, github_login, userId]
  );
  return { message: "GitHub 绑定成功" };
};

/**
 * 注册新用户并绑定 GitHub
 * 输入 email, password, confirmPassword, github_id
 * 返回 account + JWT
 */
export const registerWithGitHub = async ({ email, password, confirmPassword, github_id }) => {
  if (!email || !password || !confirmPassword) throw new Error("参数缺失");
  if (password !== confirmPassword) throw new Error("两次密码不一致");

  // 检查邮箱是否已注册
  const [exists] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (exists.length) throw new Error("邮箱已注册");

  // 检查 github_id 是否已被占用
  const [ghExists] = await pool.query("SELECT id FROM users WHERE github_id = ? LIMIT 1", [github_id]);
  if (ghExists.length) throw new Error("该 GitHub 已被绑定");

  // 生成唯一 account
  const { randomNumericAccount, hashPassword } = await import("../../utils/crypto.js");
  const account = await (async () => {
    for (let i = 0; i < 10; i++) {
      const acc = randomNumericAccount();
      const [r] = await pool.query("SELECT id FROM users WHERE account = ? LIMIT 1", [acc]);
      if (!r.length) return acc;
    }
    throw new Error("生成账号失败");
  })();

  const password_hash = await hashPassword(password);

  await pool.query(
    "INSERT INTO users (account, email, password_hash, github_id) VALUES (?,?,?,?)",
    [account, email, password_hash, github_id]
  );

  // 获取新用户
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = rows[0];
  const token = generateToken({ userId: user.id, account: user.account, email: user.email });

  return { account, token };
};
