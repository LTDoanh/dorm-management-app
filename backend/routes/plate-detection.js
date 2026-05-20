import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ================= CẤU HÌNH =================
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || "9MSjoRWOeYUHu9KJBbIY";
const ROBOFLOW_API_URL = "https://detect.roboflow.com";
const WORKSPACE_NAME = "doanh-z7o6o";
const WORKFLOW_ID = "text-recognition";
const SCAN_INTERVAL_MS = 5000; // 5 giây/frame

// Lưu trạng thái scan cho từng building (in-memory)
const scanSessions = new Map();

// ================= HÀM XỬ LÝ =================

/**
 * Kiểm tra biển số hợp lệ
 */
function isValidPlate(text) {
  if (!text || typeof text !== "string") return false;
  const clean = text.replace(/\s+/g, "").toUpperCase();
  const BLACKLIST = [
    "LICENSEPLATE", "LICENSE_PLATE", "VEHICLE", "CAR",
    "PLATE", "TEXT", "NULL", "UNDEFINED", "OBJECT", "DETECT",
  ];
  if (clean.length < 4) return false;
  if (BLACKLIST.some((b) => clean.includes(b))) return false;
  if (!/\d/.test(clean)) return false;
  return true;
}

/**
 * Parse kết quả từ Roboflow API đệ quy tìm text biển số
 */
function parseResult(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const targetKeys = ["output", "raw_output", "response", "openai_response", "text", "ocr", "google_vision_ocr", "content"];
    for (const key of targetKeys) {
      if (key in data) {
        const val = data[key];
        if (typeof val === "string" && isValidPlate(val)) return val;
        const found = parseResult(val);
        if (found) return found;
      }
    }
    for (const [k, v] of Object.entries(data)) {
      if (["class", "class_name", "image"].includes(k)) continue;
      const found = parseResult(v);
      if (found) return found;
    }
  } else if (Array.isArray(data)) {
    for (const item of data) {
      const found = parseResult(item);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Lấy danh sách biển số xe đã đăng ký trong tòa nhà
 */
async function getRegisteredPlates(buildingId) {
  const result = await pool.query(
    `SELECT DISTINCT t.license_plate
     FROM tenants t
     JOIN rooms r ON t.room_id = r.id
     WHERE r.building_id = $1 AND t.license_plate IS NOT NULL AND t.license_plate != ''`,
    [buildingId]
  );
  return result.rows.map((r) => r.license_plate.replace(/\s+/g, "").toUpperCase());
}

/**
 * Chụp 1 frame từ go2rtc snapshot API
 */
async function captureFrame(go2rtcUrl, rtspUrl) {
  const snapshotUrl = `${go2rtcUrl}/api/frame.jpeg?src=${encodeURIComponent(rtspUrl)}`;
  const res = await fetch(snapshotUrl);
  if (!res.ok) throw new Error(`Snapshot failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

/**
 * Gọi Roboflow Cloud API để OCR biển số từ ảnh (base64)
 */
async function detectPlate(imageBuffer) {
  const base64Image = imageBuffer.toString("base64");

  const res = await fetch(
    `${ROBOFLOW_API_URL}/infer/workflows/${WORKSPACE_NAME}/${WORKFLOW_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: ROBOFLOW_API_KEY,
        inputs: {
          image: { type: "base64", value: base64Image },
        },
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Roboflow API error: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Tạo thông báo biển số xe lạ cho chủ trọ
 */
async function createUnknownPlateNotification(buildingId, plateText, ownerId) {
  const now = new Date();
  const timeStr = now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  // Lấy tên tòa nhà
  const buildingResult = await pool.query("SELECT name FROM buildings WHERE id = $1", [buildingId]);
  const buildingName = buildingResult.rows[0]?.name || "Không xác định";

  await pool.query(
    `INSERT INTO notifications (owner_id, tenant_id, room_id, type, title, message, data)
     VALUES ($1, NULL, NULL, 'unknown_plate', $2, $3, $4)`,
    [
      ownerId,
      "⚠️ Phát hiện biển số xe lạ",
      `Biển số: ${plateText}\nThời gian: ${timeStr}\nTòa nhà: ${buildingName}`,
      JSON.stringify({
        plate: plateText,
        buildingId: buildingId,
        buildingName: buildingName,
        detectedAt: now.toISOString(),
      }),
    ]
  );

  console.log(`🚨 Xe lạ phát hiện: ${plateText} tại ${buildingName} lúc ${timeStr}`);
}

/**
 * Vòng lặp quét biển số cho 1 tòa nhà
 */
async function scanLoop(buildingId) {
  const session = scanSessions.get(buildingId);
  if (!session || !session.running) return;

  try {
    const go2rtcUrl = process.env.GO2RTC_URL;
    if (!go2rtcUrl) {
      session.lastError = "GO2RTC_URL chưa được cấu hình";
      session.running = false;
      return;
    }

    // Lấy thông tin tòa nhà
    const buildingResult = await pool.query(
      "SELECT camera_rtsp, owner_id FROM buildings WHERE id = $1",
      [buildingId]
    );
    if (buildingResult.rows.length === 0) {
      session.lastError = "Không tìm thấy tòa nhà";
      session.running = false;
      return;
    }

    const { camera_rtsp, owner_id } = buildingResult.rows[0];
    if (!camera_rtsp) {
      session.lastError = "Tòa nhà chưa có camera RTSP";
      session.running = false;
      return;
    }

    // Chụp frame
    const imageBuffer = await captureFrame(go2rtcUrl, camera_rtsp);
    session.frameCount++;

    // Gọi Roboflow OCR
    const result = await detectPlate(imageBuffer);

    if (result) {
      const plateText = parseResult(result);
      if (plateText) {
        const cleanPlate = plateText.replace(/\s+/g, "").toUpperCase();
        session.lastDetected = cleanPlate;
        session.lastDetectedAt = new Date().toISOString();

        // Lấy danh sách biển số đã đăng ký
        const registeredPlates = await getRegisteredPlates(buildingId);

        if (!registeredPlates.includes(cleanPlate)) {
          // Kiểm tra xem đã thông báo biển số này trong 10 phút gần đây chưa
          const recentKey = `${buildingId}_${cleanPlate}`;
          const lastNotified = session.notifiedPlates?.get(recentKey);
          const now = Date.now();

          if (!lastNotified || now - lastNotified > 10 * 60 * 1000) {
            // Xe lạ → tạo thông báo
            await createUnknownPlateNotification(buildingId, cleanPlate, owner_id);
            if (!session.notifiedPlates) session.notifiedPlates = new Map();
            session.notifiedPlates.set(recentKey, now);
            session.unknownPlates.add(cleanPlate);
          }
        } else {
          session.knownPlates.add(cleanPlate);
        }
      }
    }

    session.lastError = null;
  } catch (err) {
    session.lastError = err.message;
    console.error(`❌ Lỗi scan building ${buildingId}:`, err.message);
  }

  // Lặp lại nếu vẫn đang chạy
  if (session.running) {
    session.timer = setTimeout(() => scanLoop(buildingId), SCAN_INTERVAL_MS);
  }
}

// ================= API ENDPOINTS =================

/**
 * POST /api/plate-detection/scan/:buildingId
 * Bắt đầu quét biển số cho tòa nhà
 */
router.post("/scan/:buildingId", async (req, res) => {
  const { buildingId } = req.params;

  // Kiểm tra tòa nhà tồn tại
  try {
    const buildingResult = await pool.query(
      "SELECT id, camera_rtsp FROM buildings WHERE id = $1",
      [buildingId]
    );
    if (buildingResult.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy tòa nhà" });
    }
    if (!buildingResult.rows[0].camera_rtsp) {
      return res.status(400).json({ error: "Tòa nhà chưa có camera RTSP" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Lỗi kiểm tra tòa nhà" });
  }

  // Dừng session cũ nếu có
  const existingSession = scanSessions.get(parseInt(buildingId));
  if (existingSession) {
    existingSession.running = false;
    clearTimeout(existingSession.timer);
  }

  // Tạo session mới
  const session = {
    running: true,
    startedAt: new Date().toISOString(),
    frameCount: 0,
    lastDetected: null,
    lastDetectedAt: null,
    lastError: null,
    knownPlates: new Set(),
    unknownPlates: new Set(),
    notifiedPlates: new Map(),
    timer: null,
  };
  scanSessions.set(parseInt(buildingId), session);

  // Bắt đầu scan loop
  scanLoop(parseInt(buildingId));

  res.json({ message: "Đã bắt đầu giám sát biển số xe", buildingId });
});

/**
 * POST /api/plate-detection/stop/:buildingId
 * Dừng quét biển số
 */
router.post("/stop/:buildingId", (req, res) => {
  const { buildingId } = req.params;
  const session = scanSessions.get(parseInt(buildingId));

  if (!session || !session.running) {
    return res.json({ message: "Không có phiên giám sát nào đang chạy" });
  }

  session.running = false;
  clearTimeout(session.timer);

  res.json({
    message: "Đã dừng giám sát biển số xe",
    stats: {
      frameCount: session.frameCount,
      knownPlates: [...session.knownPlates],
      unknownPlates: [...session.unknownPlates],
    },
  });
});

/**
 * GET /api/plate-detection/status/:buildingId
 * Lấy trạng thái quét
 */
router.get("/status/:buildingId", (req, res) => {
  const { buildingId } = req.params;
  const session = scanSessions.get(parseInt(buildingId));

  if (!session) {
    return res.json({
      running: false,
      frameCount: 0,
      lastDetected: null,
      lastDetectedAt: null,
      lastError: null,
      knownPlates: [],
      unknownPlates: [],
    });
  }

  res.json({
    running: session.running,
    startedAt: session.startedAt,
    frameCount: session.frameCount,
    lastDetected: session.lastDetected,
    lastDetectedAt: session.lastDetectedAt,
    lastError: session.lastError,
    knownPlates: [...session.knownPlates],
    unknownPlates: [...session.unknownPlates],
  });
});

export default router;
