import * as authService from "../services/authService.js";
import { verifyToken } from "../utils/jwt.js";

export const register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;
    const payload = verifyToken(token); // JWT 校验
    const result = await authService.verifyEmail(payload.userId);
    res.send(result.message);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
