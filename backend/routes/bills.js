import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT id, user_id, room, electric, water, service, created_at FROM bills WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy hóa đơn" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
