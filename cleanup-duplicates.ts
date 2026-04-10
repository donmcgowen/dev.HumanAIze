import { drizzle } from "drizzle-orm/mysql2/promise";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema";
import { eq } from "drizzle-orm";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = drizzle(pool, { schema, mode: "default" });

async function main() {
  try {
    // Get all users
    const users = await db.query.users.findMany();
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      // Get all custom_app sources for this user, sorted by creation date
      const customSources = await db.query.healthSources.findMany({
        where: (hs, { eq, and }) => 
          and(eq(hs.userId, user.id), eq(hs.provider, "custom_app")),
        orderBy: (hs, { asc }) => asc(hs.createdAt)
      });

      console.log(`\nUser ${user.id} (${user.email}): ${customSources.length} custom_app sources`);
      customSources.forEach(s => {
        console.log(`  - ID ${s.id}: "${s.displayName}" (status: ${s.status}, created: ${s.createdAt})`);
      });

      // Keep only the first one (the seeded "Custom App" source)
      // Delete all others
      if (customSources.length > 1) {
        const toDelete = customSources.slice(1);
        console.log(`  Deleting ${toDelete.length} duplicate(s)...`);
        
        for (const source of toDelete) {
          await db.delete(schema.healthSources).where(
            eq(schema.healthSources.id, source.id)
          );
          console.log(`    Deleted ID ${source.id}`);
        }
      }
    }

    console.log("\nCleanup complete!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

main();
