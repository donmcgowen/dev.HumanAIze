#!/usr/bin/env node
/**
 * Cleanup script using raw SQL to remove unwanted sources
 */

import mysql from "mysql2/promise";

const providersToDelete = [
  "fitbit",
  "oura",
  "apple_health",
  "google_fit",
  "glooko",
  "myfitnesspal",
  "cronometer",
];

async function cleanup() {
  let connection;
  try {
    console.log("🧹 Starting cleanup of unwanted sources...");
    console.log(`Providers to delete: ${providersToDelete.join(", ")}`);

    connection = await mysql.createConnection(process.env.DATABASE_URL);

    // Disable foreign key checks temporarily
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
    console.log("Disabled foreign key checks");

    // Delete from all related tables
    const placeholders = providersToDelete.map(() => "?").join(",");

    const tables = [
      "glucose_readings",
      "activity_samples",
      "sleep_sessions",
      "nutrition_logs",
      "sync_jobs",
    ];

    for (const table of tables) {
      const query = `DELETE FROM ${table} WHERE sourceId IN (SELECT id FROM health_sources WHERE provider IN (${placeholders}))`;
      const [result] = await connection.execute(query, providersToDelete);
      console.log(`  - Deleted ${result.affectedRows} rows from ${table}`);
    }

    // Delete the sources themselves
    const deleteSourcesQuery = `DELETE FROM health_sources WHERE provider IN (${placeholders})`;
    const [result] = await connection.execute(deleteSourcesQuery, providersToDelete);
    console.log(`  - Deleted ${result.affectedRows} sources`);

    // Re-enable foreign key checks
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log("Re-enabled foreign key checks");

    console.log("✅ Cleanup complete!");
    console.log("📝 Remaining sources: Dexcom (provider) and custom_app only");
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanup();
