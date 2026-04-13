import mysql from 'mysql2/promise';
import { createSecureContext } from 'tls';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not set');
}

const url = new URL(connectionString);
const config = {
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  port: url.port || 3306,
  ssl: true
};

// Add SSL context
config.ssl = {
  rejectUnauthorized: false
};

const connection = await mysql.createConnection(config);

try {
  // Create weight_entries table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS weight_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      weightLbs DECIMAL(6, 1) NOT NULL,
      recordedAt BIGINT NOT NULL,
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_userId_recordedAt (userId, recordedAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await connection.execute(createTableSQL);
  console.log('✅ weight_entries table created successfully');

  await connection.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  await connection.end();
  process.exit(1);
}
