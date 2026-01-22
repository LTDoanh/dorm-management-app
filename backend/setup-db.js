/**
 * Script để setup database
 * Chạy: node setup-db.js
 */

import { pool, testConnection } from "./db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupDatabase = async () => {
  try {
    console.log("🔄 Đang kiểm tra kết nối database...");
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error("❌ Không thể kết nối database. Vui lòng kiểm tra cấu hình trong file .env");
      process.exit(1);
    }

    console.log("✅ Kết nối database thành công!");
    console.log("🔄 Đang tạo các bảng...");

    // Đọc file schema.sql
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Tách các câu lệnh SQL (tách bằng dấu ;)
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    // Thực thi từng câu lệnh
    for (const statement of statements) {
      if (statement) {
        try {
          await pool.query(statement);
          console.log(`✅ Đã thực thi: ${statement.substring(0, 50)}...`);
        } catch (err) {
          // Bỏ qua lỗi nếu bảng đã tồn tại
          if (err.message.includes("already exists") || err.message.includes("duplicate")) {
            console.log(`⚠️  Đã tồn tại: ${statement.substring(0, 50)}...`);
          } else {
            console.error(`❌ Lỗi: ${err.message}`);
          }
        }
      }
    }

    console.log("\n✅ Setup database hoàn tất!");
    console.log("📝 Các bảng đã được tạo:");
    console.log("   - users");
    console.log("   - buildings");
    console.log("   - rooms");
    console.log("   - tenants");

    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi setup database:", err);
    process.exit(1);
  }
};

setupDatabase();

