#!/usr/bin/env node
import mysql from "mysql2/promise";

async function check() {
  let connection;
  try {
    connection = await mysql.createConnection(process.env.DATABASE_URL);

    // Check what sources exist
    const [rows] = await connection.execute(
      "SELECT provider, COUNT(*) as count FROM health_sources GROUP BY provider"
    );

    console.log("📊 Sources in database:");
    rows.forEach((row) => {
      console.log(`  ${row.provider}: ${row.count}`);
    });

    // Check total
    const [total] = await connection.execute(
      "SELECT COUNT(*) as total FROM health_sources"
    );
    console.log(`\nTotal sources: ${total[0].total}`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

check();
