import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log("Adding prev_electricity_index and prev_water_index to rooms table...");
    await pool.query(`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS prev_electricity_index DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS prev_water_index DECIMAL(10, 2) DEFAULT 0;
    `);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

migrate();
