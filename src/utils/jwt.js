import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const generateToken = (payload, expiresIn) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: expiresIn || config.jwt.expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};
