import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Lấy danh sách tòa nhà của chủ trọ
router.get("/owner/:ownerId", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM buildings WHERE owner_id = $1 ORDER BY created_at DESC",
      [req.params.ownerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy tòa nhà:", err);
    res.status(500).json({ error: "Không lấy được tòa nhà" });
  }
});

// Lấy thông tin một tòa nhà
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM buildings WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy tòa nhà" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi lấy tòa nhà:", err);
    res.status(500).json({ error: "Không lấy được tòa nhà" });
  }
});

// Tạo tòa nhà mới
router.post("/", async (req, res) => {
  const { name, address, ownerId } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO buildings (name, address, owner_id) VALUES ($1, $2, $3) RETURNING *",
      [name, address || null, ownerId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi thêm tòa nhà:", err);
    res.status(500).json({ error: "Không thêm được tòa nhà" });
  }
});

// Cập nhật tòa nhà
router.put("/:id", async (req, res) => {
  const { name, address } = req.body;
  try {
    const result = await pool.query(
      "UPDATE buildings SET name = $1, address = $2 WHERE id = $3 RETURNING *",
      [name, address || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy tòa nhà" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi cập nhật tòa nhà:", err);
    res.status(500).json({ error: "Không cập nhật được tòa nhà" });
  }
});

// Xóa tòa nhà
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM buildings WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy tòa nhà" });
    }
    res.json({ message: "Xóa tòa nhà thành công" });
  } catch (err) {
    console.error("Lỗi xóa tòa nhà:", err);
    res.status(500).json({ error: "Không xóa được tòa nhà" });
  }
});

export default router;

