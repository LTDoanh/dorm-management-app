import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { id, name, avatar, role, phone_number } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (id, name, avatar, role, phone_number)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         avatar = EXCLUDED.avatar,
         role = EXCLUDED.role,
         phone_number = COALESCE(EXCLUDED.phone_number, users.phone_number)
       RETURNING *`,
      [id, name, avatar, role, phone_number || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi lưu user:", err);
    res.status(500).json({ error: "Không lưu được user" });
  }
});


router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy danh sách user:", err);
    res.status(500).json({ error: "Không lấy được danh sách user" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.params.id,
    ]);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error("Lỗi lấy user:", err);
    res.status(500).json({ error: "Không lấy được user" });
  }
});

// Cập nhật thông tin tài khoản ngân hàng và liên hệ
router.put("/:id/bank-account", async (req, res) => {
  const { bank_account, bank_name, qr_code_url, phone_number } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users 
       SET bank_account = COALESCE($1, bank_account),
           bank_name = COALESCE($2, bank_name),
           qr_code_url = COALESCE($3, qr_code_url),
           phone_number = COALESCE($4, phone_number)
       WHERE id = $5
       RETURNING *`,
      [bank_account || null, bank_name || null, qr_code_url || null, phone_number || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi cập nhật thông tin user:", err);
    res.status(500).json({ error: "Không cập nhật được thông tin user" });
  }
});

export default router;
