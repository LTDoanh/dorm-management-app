import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log("Adding current_electricity_index and current_water_index to payment_details table...");
        await pool.query(`
      ALTER TABLE payment_details 
      ADD COLUMN IF NOT EXISTS current_electricity_index DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS current_water_index DECIMAL(10, 2) DEFAULT 0;
    `);
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
