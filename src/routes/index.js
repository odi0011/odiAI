import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS currentTime");
    res.json({ message: "数据库连接成功", time: rows[0].currentTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
