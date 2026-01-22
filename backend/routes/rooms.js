import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Lấy danh sách phòng trong một tòa nhà
router.get("/building/:buildingId", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM rooms WHERE building_id = $1 ORDER BY name ASC",
      [req.params.buildingId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy phòng:", err);
    res.status(500).json({ error: "Không lấy được phòng" });
  }
});

// Lấy thông tin một phòng
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM rooms WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phòng" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi lấy phòng:", err);
    res.status(500).json({ error: "Không lấy được phòng" });
  }
});

// Tạo phòng mới
router.post("/", async (req, res) => {
  const { name, buildingId, ownerId } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO rooms (name, building_id, owner_id) VALUES ($1, $2, $3) RETURNING *",
      [name, buildingId, ownerId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi thêm phòng:", err);
    res.status(500).json({ error: "Không thêm được phòng" });
  }
});

// Cập nhật phòng
router.put("/:id", async (req, res) => {
  const { name, room_price, service_fee, electricity_price, water_price } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rooms 
       SET name = COALESCE($1, name),
           room_price = COALESCE($2, room_price),
           service_fee = COALESCE($3, service_fee),
           electricity_price = COALESCE($4, electricity_price),
           water_price = COALESCE($5, water_price)
       WHERE id = $6 
       RETURNING *`,
      [name || null, room_price || null, service_fee || null, electricity_price || null, water_price || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phòng" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi cập nhật phòng:", err);
    res.status(500).json({ error: "Không cập nhật được phòng" });
  }
});

// Xóa phòng
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM rooms WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phòng" });
    }
    res.json({ message: "Xóa phòng thành công" });
  } catch (err) {
    console.error("Lỗi xóa phòng:", err);
    res.status(500).json({ error: "Không xóa được phòng" });
  }
});

export default router;
