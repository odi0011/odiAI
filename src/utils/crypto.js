// src/utils/crypto.js
import bcrypt from "bcrypt";

/**
 * hash password
 */
export const hashPassword = (plain) => bcrypt.hash(plain, 10);

/**
 * compare password
 */
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

/**
 * 生成 6~10 位纯数字账号（随机长度），确保字符串形式，不以 0 开头也允许（可按需修改）
 * 不在这里做唯一检查，业务层会检查 DB 确认唯一
 */
export const randomNumericAccount = (length) => {
  let len = length || Math.floor(Math.random() * 5) + 6; // 6~10
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
};
