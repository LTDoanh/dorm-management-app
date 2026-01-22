import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Lấy chi tiết hóa đơn của người thuê trọ
router.get("/tenant/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Lấy thông tin tenant và room
    const tenantResult = await pool.query(
      `SELECT t.*, r.name as room_name, r.room_price, r.service_fee, 
              r.electricity_price, r.water_price, b.name as building_name,
              u.bank_account, u.bank_name, u.qr_code_url
       FROM tenants t
       JOIN rooms r ON t.room_id = r.id
       JOIN buildings b ON r.building_id = b.id
       JOIN users u ON r.owner_id = u.id
       WHERE t.user_id = $1
       ORDER BY t.last_bill_at DESC NULLS LAST
       LIMIT 1`,
      [userId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy thông tin người thuê trọ" });
    }

    const tenant = tenantResult.rows[0];
    
    // Đảm bảo tất cả tenant trong cùng phòng có cùng current_bill và debt
    // Lấy giá trị từ tenant đầu tiên trong phòng (tất cả đều giống nhau)
    const roomTenantsResult = await pool.query(
      `SELECT current_bill, debt, payment_status, owner_confirmed_amount
       FROM tenants 
       WHERE room_id = $1 
       ORDER BY id ASC 
       LIMIT 1`,
      [tenant.room_id]
    );
    
    // Nếu có tenant khác trong phòng, đồng bộ giá trị
    if (roomTenantsResult.rows.length > 0) {
      const roomTenant = roomTenantsResult.rows[0];
      // Cập nhật tenant hiện tại để đảm bảo đồng bộ
      tenant.current_bill = roomTenant.current_bill;
      tenant.debt = roomTenant.debt;
      tenant.payment_status = roomTenant.payment_status;
      tenant.owner_confirmed_amount = roomTenant.owner_confirmed_amount;
    }
    
    // Lấy chi tiết hóa đơn từ payment_details (lấy từ bất kỳ tenant nào trong phòng)
    const detailResult = await pool.query(
      `SELECT pd.* FROM payment_details pd
       JOIN tenants t ON pd.tenant_id = t.id
       WHERE t.room_id = $1 
       ORDER BY pd.created_at DESC 
       LIMIT 1`,
      [tenant.room_id]
    );

    let paymentDetail = null;
    if (detailResult.rows.length > 0) {
      paymentDetail = detailResult.rows[0];
    } else {
      // Nếu chưa có chi tiết, tính từ current_bill và giá phòng
      // Lấy giá từ room
      const roomResult = await pool.query(
        `SELECT room_price, service_fee FROM rooms WHERE id = $1`,
        [tenant.room_id]
      );
      const room = roomResult.rows[0] || {};
      
      paymentDetail = {
        room_price: room.room_price || 0,
        service_fee: room.service_fee || 0,
        electricity_amount: 0,
        water_amount: 0,
        penalty: 0,
        debt_amount: tenant.debt || 0,
        total_amount: tenant.current_bill || 0,
      };
    }

    res.json({
      tenant: {
        id: tenant.id,
        roomName: tenant.room_name,
        buildingName: tenant.building_name,
        currentBill: parseFloat(tenant.current_bill || 0),
        debt: parseFloat(tenant.debt || 0),
        paymentStatus: tenant.payment_status || 'pending',
        ownerConfirmedAmount: parseFloat(tenant.owner_confirmed_amount || 0),
      },
      details: {
        roomPrice: parseFloat(paymentDetail.room_price || 0),
        serviceFee: parseFloat(paymentDetail.service_fee || 0),
        electricityAmount: parseFloat(paymentDetail.electricity_amount || 0),
        waterAmount: parseFloat(paymentDetail.water_amount || 0),
        penalty: parseFloat(paymentDetail.penalty || 0),
        debtAmount: parseFloat(paymentDetail.debt_amount || 0),
        totalAmount: parseFloat(paymentDetail.total_amount || 0),
      },
      ownerBankInfo: {
        bankAccount: tenant.bank_account,
        bankName: tenant.bank_name,
        qrCodeUrl: tenant.qr_code_url,
      },
    });
  } catch (err) {
    console.error("Lỗi lấy hóa đơn:", err);
    res.status(500).json({ error: "Không lấy được hóa đơn" });
  }
});

// Người thuê xác nhận đã chuyển khoản
router.post("/confirm", async (req, res) => {
  try {
    const { tenantId } = req.body;
    
    // Lấy thông tin tenant để biết room_id
    const tenantResult = await pool.query(
      `SELECT room_id FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người thuê trọ" });
    }

    const roomId = tenantResult.rows[0].room_id;

    // Cập nhật TẤT CẢ tenant trong cùng phòng thành waiting_confirmation
    const result = await pool.query(
      `UPDATE tenants 
       SET payment_status = 'waiting_confirmation',
           payment_confirmed_at = CURRENT_TIMESTAMP
       WHERE room_id = $1
       RETURNING *`,
      [roomId]
    );

    // Lấy thông tin phòng và chủ trọ để tạo thông báo (chỉ cần 1 notification cho cả phòng)
    const roomResult = await pool.query(
      `SELECT r.owner_id, r.name as room_name, r.building_id, b.name as building_name
       FROM rooms r
       JOIN buildings b ON r.building_id = b.id
       WHERE r.id = $1`,
      [roomId]
    );

    if (roomResult.rows.length > 0) {
      const room = roomResult.rows[0];
      
      // Lấy thông tin hóa đơn từ một tenant bất kỳ trong phòng (tất cả đều giống nhau)
      const sampleTenant = result.rows[0];
      const totalAmount = parseFloat(sampleTenant.current_bill || 0) + parseFloat(sampleTenant.debt || 0);

      // Kiểm tra xem đã có notification cho phòng này chưa (tránh tạo duplicate)
      const existingNotification = await pool.query(
        `SELECT id FROM notifications 
         WHERE room_id = $1 AND type = 'payment_confirmation' AND is_read = FALSE
         LIMIT 1`,
        [roomId]
      );

      // Chỉ tạo notification nếu chưa có
      if (existingNotification.rows.length === 0) {
        // Lấy tenant_id đầu tiên để làm đại diện (có thể dùng bất kỳ tenant nào)
        const representativeTenantId = result.rows[0].id;

        // Tạo thông báo cho chủ trọ (1 notification cho cả phòng)
        await pool.query(
          `INSERT INTO notifications (owner_id, tenant_id, room_id, type, title, message, data)
           VALUES ($1, $2, $3, 'payment_confirmation', $4, $5, $6)`,
          [
            room.owner_id,
            representativeTenantId,
            roomId,
            "Xác nhận thanh toán",
            `Người thuê trọ đã xác nhận thanh toán hóa đơn phòng ${room.room_name}`,
            JSON.stringify({
              totalAmount: totalAmount,
              currentBill: sampleTenant.current_bill,
              debt: sampleTenant.debt,
              roomName: room.room_name,
              buildingName: room.building_name,
            }),
          ]
        );
      }
    }

    res.json({ 
      message: "Đã xác nhận chuyển khoản, đang chờ chủ trọ xác nhận",
      updatedCount: result.rowCount
    });
  } catch (err) {
    console.error("Lỗi xác nhận thanh toán:", err);
    res.status(500).json({ error: "Không thể xác nhận thanh toán" });
  }
});

// Chủ trọ xác nhận đã nhận tiền
router.post("/owner-confirm", async (req, res) => {
  try {
    const { tenantId, receivedAmount } = req.body;
    
    // Lấy thông tin tenant để biết room_id
    const tenantResult = await pool.query(
      `SELECT room_id, current_bill, debt FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người thuê trọ" });
    }

    const tenant = tenantResult.rows[0];
    const roomId = tenant.room_id;
    const totalAmount = parseFloat(tenant.current_bill || 0) + parseFloat(tenant.debt || 0);
    const received = parseFloat(receivedAmount || 0);
    const difference = received - totalAmount;

    let newStatus = 'paid';
    if (difference < 0) {
      newStatus = 'partial';
    } else if (difference > 0) {
      newStatus = 'overpaid';
    }

    // Cập nhật TẤT CẢ tenant trong cùng phòng với cùng trạng thái và số tiền đã nhận
    // Tất cả tenant trong phòng sẽ có cùng payment_status và owner_confirmed_amount
    const updateResult = await pool.query(
      `UPDATE tenants 
       SET payment_status = $1,
           owner_confirmed_amount = $2,
           owner_confirmed_at = CURRENT_TIMESTAMP,
           current_bill = CASE 
             WHEN $2 >= current_bill THEN 0 
             ELSE current_bill - $2 
           END,
           debt = CASE 
             WHEN $2 >= (current_bill + debt) THEN 0
             WHEN $2 >= current_bill THEN debt - ($2 - current_bill)
             ELSE debt
           END
       WHERE room_id = $3
       RETURNING *`,
      [newStatus, received, roomId]
    );

    // Xóa tất cả thông báo liên quan đến phòng này
    await pool.query(
      `DELETE FROM notifications 
       WHERE room_id = $1 AND type = 'payment_confirmation' AND is_read = FALSE`,
      [roomId]
    );

    res.json({
      message: "Đã xác nhận nhận tiền",
      updatedCount: updateResult.rowCount,
      difference: difference,
      status: newStatus,
    });
  } catch (err) {
    console.error("Lỗi xác nhận nhận tiền:", err);
    res.status(500).json({ error: "Không thể xác nhận nhận tiền" });
  }
});

// Lấy trạng thái thanh toán của tenant
router.get("/tenant/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT t.*, r.name as room_name
       FROM tenants t
       JOIN rooms r ON t.room_id = r.id
       WHERE t.user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người thuê trọ" });
    }

    const tenant = result.rows[0];
    const totalAmount = parseFloat(tenant.current_bill || 0) + parseFloat(tenant.debt || 0);
    const received = parseFloat(tenant.owner_confirmed_amount || 0);
    const difference = totalAmount - received;

    res.json({
      paymentStatus: tenant.payment_status || 'pending',
      totalAmount: totalAmount,
      receivedAmount: received,
      difference: difference,
      roomName: tenant.room_name,
    });
  } catch (err) {
    console.error("Lỗi lấy trạng thái thanh toán:", err);
    res.status(500).json({ error: "Không lấy được trạng thái thanh toán" });
  }
});

export default router;

