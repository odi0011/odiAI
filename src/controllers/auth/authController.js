// src/controllers/authController.js
import * as authService from "../../services/auth/authService.js";

const wrap = (fn) => async (req, res) => {
  try {
    const result = await fn(req, res);
    res.json({ success: true, ...(result || {}) });
  } catch (err) {
    // 统一错误返回（400 用于业务错误，500 用于意外错误）
    const status = err.message && /参数|不存在|错误|过期|已/.test(err.message) ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

export const sendCode = wrap(async (req) => {
  const { email, purpose } = req.body;
  return await authService.sendEmailCode({ email, purpose });
});

export const register = wrap(async (req) => {
  const { email, code, password, confirmPassword } = req.body;
  return await authService.registerByEmail({ email, code, password, confirmPassword });
});

export const loginPassword = wrap(async (req) => {
  const { account, email, password } = req.body;
  return await authService.loginWithPassword({ account, email, password });
});

export const loginWithCode = wrap(async (req) => {
  const { email, code } = req.body;
  return await authService.loginWithEmailCode({ email, code });
});

export const sendReset = wrap(async (req) => {
  const { email } = req.body;
  return await authService.sendEmailCode({ email, purpose: "reset" });
});

export const resetByCode = wrap(async (req) => {
  const { email, code, newPassword, confirmPassword } = req.body;
  return await authService.resetPasswordByCode({ email, code, newPassword, confirmPassword });
});

export const changeWithOld = wrap(async (req) => {
  const { email, oldPassword, newPassword, confirmPassword } = req.body;
  return await authService.changePasswordWithOld({ email, oldPassword, newPassword, confirmPassword });
});