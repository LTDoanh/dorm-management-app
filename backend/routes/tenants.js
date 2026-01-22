import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Lấy danh sách người thuê trọ trong một phòng
router.get("/room/:roomId", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as nickname, u.avatar 
       FROM tenants t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.room_id = $1 
       ORDER BY t.created_at DESC`,
      [req.params.roomId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy người thuê trọ:", err);
    res.status(500).json({ error: "Không lấy được người thuê trọ" });
  }
});

// Thêm người thuê trọ vào phòng
router.post("/", async (req, res) => {
  const { roomId, userId } = req.body;
  try {
    // Kiểm tra xem user đã có trong phòng chưa
    const checkResult = await pool.query(
      "SELECT * FROM tenants WHERE room_id = $1 AND user_id = $2",
      [roomId, userId]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: "Người dùng đã có trong phòng này" });
    }

    const result = await pool.query(
      "INSERT INTO tenants (room_id, user_id) VALUES ($1, $2) RETURNING *",
      [roomId, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi thêm người thuê trọ:", err);
    res.status(500).json({ error: "Không thêm được người thuê trọ" });
  }
});

// Xóa người thuê trọ khỏi phòng
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tenants WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người thuê trọ" });
    }
    res.json({ message: "Xóa người thuê trọ thành công" });
  } catch (err) {
    console.error("Lỗi xóa người thuê trọ:", err);
    res.status(500).json({ error: "Không xóa được người thuê trọ" });
  }
});

// Xóa tất cả người thuê trọ trong phòng
router.delete("/room/:roomId/all", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tenants WHERE room_id = $1 RETURNING *",
      [req.params.roomId]
    );
    res.json({ 
      message: "Xóa tất cả người thuê trọ thành công",
      deletedCount: result.rows.length 
    });
  } catch (err) {
    console.error("Lỗi xóa tất cả người thuê trọ:", err);
    res.status(500).json({ error: "Không xóa được người thuê trọ" });
  }
});

// Tìm user bằng số điện thoại (giả sử số điện thoại được lưu trong users table)
// Cần thêm cột phone vào users table hoặc tìm qua idByOA
router.post("/find-by-phone", async (req, res) => {
  const { phone } = req.body;
  try {
    // Tìm user bằng số điện thoại (giả sử có cột phone trong users)
    // Hoặc có thể tìm qua idByOA nếu số điện thoại là idByOA
    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1 OR id_by_oa = $1 LIMIT 1",
      [phone]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng với số điện thoại này" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi tìm user:", err);
    res.status(500).json({ error: "Không tìm được user" });
  }
});

// Tạo hóa đơn tháng cho toàn bộ người thuê trong phòng
router.post("/room/:roomId/billing", async (req, res) => {
  const { water_usage, electricity_usage, penalty = 0 } = req.body;

  if (water_usage === undefined || electricity_usage === undefined) {
    return res.status(400).json({ error: "Thiếu số nước hoặc số điện" });
  }

  try {
    // Lấy thông tin phòng
    const roomResult = await pool.query(
      "SELECT * FROM rooms WHERE id = $1",
      [req.params.roomId]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phòng" });
    }

    const room = roomResult.rows[0];
    const roomPrice = Number(room.room_price || 0);
    const serviceFee = Number(room.service_fee || 0);
    const electricityPrice = Number(room.electricity_price || 0);
    const waterPrice = Number(room.water_price || 0);
    const waterUsage = Number(water_usage || 0);
    const electricityUsage = Number(electricity_usage || 0);
    const penaltyAmount = Number(penalty || 0);

    const electricityAmount = electricityPrice * electricityUsage;
    const waterAmount = waterPrice * waterUsage;
    const total =
      roomPrice +
      serviceFee +
      electricityAmount +
      waterAmount +
      penaltyAmount;

    // Lấy danh sách tenants trong phòng
    const tenantsResult = await pool.query(
      "SELECT id, debt FROM tenants WHERE room_id = $1",
      [req.params.roomId]
    );

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Lấy thông tin phòng và chủ trọ để tạo thông báo
    const roomInfoResult = await pool.query(
      `SELECT r.owner_id, r.name as room_name, b.name as building_name
       FROM rooms r
       JOIN buildings b ON r.building_id = b.id
       WHERE r.id = $1`,
      [req.params.roomId]
    );
    const roomInfo = roomInfoResult.rows[0];

    // Cập nhật từng tenant và lưu chi tiết hóa đơn
    for (const tenant of tenantsResult.rows) {
      const currentDebt = Number(tenant.debt || 0);
      const newDebt = currentDebt + total;

      // Cập nhật tenant
      await pool.query(
        `UPDATE tenants 
         SET current_bill = $1,
             debt = $2,
             last_bill_at = NOW(),
             payment_status = 'pending'
         WHERE id = $3`,
        [total, newDebt, tenant.id]
      );

      // Lưu chi tiết hóa đơn
      await pool.query(
        `INSERT INTO payment_details 
         (tenant_id, room_price, service_fee, electricity_amount, water_amount, 
          penalty, debt_amount, total_amount, month, year)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          tenant.id,
          roomPrice,
          serviceFee,
          electricityAmount,
          waterAmount,
          penaltyAmount,
          currentDebt,
          total,
          month,
          year,
        ]
      );

      // Tạo thông báo cho tenant về hóa đơn mới
      await pool.query(
        `INSERT INTO notifications (owner_id, tenant_id, room_id, type, title, message, data)
         VALUES ($1, $2, $3, 'new_bill', $4, $5, $6)`,
        [
          roomInfo.owner_id,
          tenant.id,
          req.params.roomId,
          "Hóa đơn tiền trọ mới",
          `Hóa đơn tháng ${month}/${year} - Phòng ${roomInfo.room_name}`,
          JSON.stringify({
            totalAmount: total,
            currentBill: total,
            debt: newDebt,
            roomPrice: roomPrice,
            serviceFee: serviceFee,
            electricityAmount: electricityAmount,
            waterAmount: waterAmount,
            penalty: penaltyAmount,
            roomName: roomInfo.room_name,
            buildingName: roomInfo.building_name,
            month: month,
            year: year,
          }),
        ]
      );
    }

    res.json({
      message: "Tính tiền phòng thành công",
      total,
      roomPrice,
      serviceFee,
      electricityAmount,
      waterAmount,
      penalty: penaltyAmount,
      water_usage: waterUsage,
      electricity_usage: electricityUsage,
      updatedTenants: tenantsResult.rows.length,
    });
  } catch (err) {
    console.error("Lỗi tạo hóa đơn:", err);
    res.status(500).json({ error: "Không tạo được hóa đơn" });
  }
});

export default router;

