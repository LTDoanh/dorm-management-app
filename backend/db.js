import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// Cấu hình database linh hoạt cho cả local và production
const getDbConfig = () => {
  // Nếu có DATABASE_URL (cho Supabase hoặc production)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  // Cấu hình cho database local (PostgreSQL)
  return {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "rental_management",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: false,
    max: 20, // Số lượng connection tối đa trong pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};

export const pool = new Pool(getDbConfig());

// Test connection khi khởi động
pool.on("connect", () => {
  console.log("✅ Kết nối database thành công");
});

pool.on("error", (err) => {
  console.error("❌ Lỗi kết nối database:", err);
});

// Test connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("✅ Database connection test:", result.rows[0].now);
    client.release();
    return true;
  } catch (err) {
    console.error("❌ Database connection test failed:", err.message);
    return false;
  }
};
