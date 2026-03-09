import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    try {
        const res = await pool.query('SELECT prev_electricity_index FROM rooms LIMIT 1');
        console.log("Rooms update success!", res.fields.map(f => f.name));

        const res2 = await pool.query('SELECT current_electricity_index FROM payment_details LIMIT 1');
        console.log("Payment_details update success!", res2.fields.map(f => f.name));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

check();
