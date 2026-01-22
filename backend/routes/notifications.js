import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Lấy danh sách thông báo của chủ trọ
router.get("/owner/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { unread_only } = req.query;

    let query = `
      SELECT n.*, 
             t.user_id as tenant_user_id,
             u.name as tenant_name,
             u.avatar as tenant_avatar,
             r.name as room_name,
             r.building_id,
             b.name as building_name,
             t.current_bill,
             t.debt
      FROM notifications n
      JOIN tenants t ON n.tenant_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN rooms r ON n.room_id = r.id
      JOIN buildings b ON r.building_id = b.id
      WHERE n.owner_id = $1
    `;

    const params = [ownerId];

    if (unread_only === "true") {
      query += " AND n.is_read = FALSE";
    }

    query += " ORDER BY n.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy thông báo:", err);
    res.status(500).json({ error: "Không lấy được thông báo" });
  }
});

// Đếm số thông báo chưa đọc
router.get("/owner/:ownerId/count", async (req, res) => {
  try {
    const { ownerId } = req.params;
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE owner_id = $1 AND is_read = FALSE",
      [ownerId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error("Lỗi đếm thông báo:", err);
    res.status(500).json({ error: "Không đếm được thông báo" });
  }
});

// Đánh dấu thông báo đã đọc
router.put("/:id/read", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy thông báo" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi đánh dấu đã đọc:", err);
    res.status(500).json({ error: "Không đánh dấu được thông báo" });
  }
});

// Đánh dấu tất cả thông báo đã đọc
router.put("/owner/:ownerId/read-all", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE owner_id = $1 RETURNING *",
      [req.params.ownerId]
    );
    res.json({ message: "Đã đánh dấu tất cả thông báo đã đọc", count: result.rowCount });
  } catch (err) {
    console.error("Lỗi đánh dấu tất cả:", err);
    res.status(500).json({ error: "Không đánh dấu được thông báo" });
  }
});

// Xóa thông báo
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM notifications WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy thông báo" });
    }
    res.json({ message: "Đã xóa thông báo" });
  } catch (err) {
    console.error("Lỗi xóa thông báo:", err);
    res.status(500).json({ error: "Không xóa được thông báo" });
  }
});

// ========== TENANT NOTIFICATIONS ==========

// Lấy danh sách thông báo của người thuê trọ
router.get("/tenant/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { unread_only } = req.query;

    let query = `
      SELECT n.*, 
             r.name as room_name,
             r.building_id,
             b.name as building_name,
             u.name as owner_name,
             u.bank_account,
             u.bank_name,
             u.qr_code_url,
             t.current_bill,
             t.debt,
             t.payment_status
      FROM notifications n
      JOIN tenants t ON n.tenant_id = t.id
      JOIN rooms r ON n.room_id = r.id
      JOIN buildings b ON r.building_id = b.id
      JOIN users u ON n.owner_id = u.id
      WHERE t.user_id = $1
    `;

    const params = [userId];

    if (unread_only === "true") {
      query += " AND n.is_read = FALSE";
    }

    query += " ORDER BY n.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy thông báo tenant:", err);
    res.status(500).json({ error: "Không lấy được thông báo" });
  }
});

// Đếm số thông báo chưa đọc của tenant
router.get("/tenant/:userId/count", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notifications n
       JOIN tenants t ON n.tenant_id = t.id
       WHERE t.user_id = $1 AND n.is_read = FALSE`,
      [userId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error("Lỗi đếm thông báo tenant:", err);
    res.status(500).json({ error: "Không đếm được thông báo" });
  }
});

// Đánh dấu tất cả thông báo của tenant đã đọc
router.put("/tenant/:userId/read-all", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE tenant_id IN (
         SELECT id FROM tenants WHERE user_id = $1
       ) AND is_read = FALSE
       RETURNING *`,
      [userId]
    );
    res.json({ message: "Đã đánh dấu tất cả thông báo đã đọc", count: result.rowCount });
  } catch (err) {
    console.error("Lỗi đánh dấu tất cả:", err);
    res.status(500).json({ error: "Không đánh dấu được thông báo" });
  }
});

export default router;

