import mysql from 'mysql2/promise';
import fs from 'fs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const url = new URL(connectionString);
const config = {
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  port: url.port || 3306,
  ssl: url.searchParams.get('ssl') === 'true' ? {} : undefined,
};

try {
  const connection = await mysql.createConnection(config);
  
  // Read and execute the migration SQL
  const sql = fs.readFileSync('./drizzle/0016_funny_black_crow.sql', 'utf-8');
  const statements = sql.split('--> statement-breakpoint').filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await connection.execute(statement);
        console.log('✓ Executed:', statement.substring(0, 60) + '...');
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME') {
          console.log('✓ Already exists');
        } else {
          throw err;
        }
      }
    }
  }
  
  console.log('✓ All migrations executed successfully');
  await connection.end();
} catch (error) {
  console.error('Migration error:', error.message);
  process.exit(1);
}
