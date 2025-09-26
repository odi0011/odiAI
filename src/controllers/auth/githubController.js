// src/controllers/auth/githubController.js
import * as githubService from "../../services/auth/githubService.js";
import { verifyToken } from "../../utils/jwt.js";
import { config } from "../../config.js";

const wrap = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    res.json({ success: true, ...(result || {}) });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * GitHub 回调登录
 * query: { code }
 */
export const githubCallback = wrap(async (req) => {
  const { code } = req.query;
  if (!code) throw new Error("code 缺失");

  const token = await githubService.getGitHubAccessToken(code);
  const ghUser = await githubService.getGitHubUser(token);

  return await githubService.loginWithGitHub(ghUser.github_id);
});

/**
 * 已登录用户绑定 GitHub
 * headers: Authorization Bearer JWT
 * body: { code }
 */
export const bindGitHub = wrap(async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("缺少授权");
  const jwtToken = authHeader.split(" ")[1];
  const payload = verifyToken(jwtToken);
  const { userId } = payload;

  const { code } = req.body;
  if (!code) throw new Error("缺少 code");

  const accessToken = await githubService.getGitHubAccessToken(code);
  const ghUser = await githubService.getGitHubUser(accessToken);

  return await githubService.bindGitHubToUser(userId, ghUser.github_id, ghUser.github_login);
});

/**
 * 新用户注册绑定 GitHub
 * body: { email, password, confirmPassword, github_id }
 */
export const registerWithGithub = wrap(async (req) => {
  return await githubService.registerWithGitHub(req.body);
});


export const githubLogin = (req, res) => {
  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl, // 注意这里用 env 配置的完整 callbackUrl
    scope: "user:email",
    allow_signup: "true",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};
