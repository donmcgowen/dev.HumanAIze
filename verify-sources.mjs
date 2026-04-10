import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

async function verifySources() {
  const conn = await pool.getConnection();
  try {
    // Get all users
    const [users] = await conn.query('SELECT id, email FROM users LIMIT 5');
    console.log(`\nFound ${users.length} users:\n`);
    
    for (const user of users) {
      // Get custom_app sources for this user
      const [sources] = await conn.query(
        'SELECT id, provider, displayName, status, createdAt FROM health_sources WHERE userId = ? AND provider = ? ORDER BY createdAt ASC',
        [user.id, 'custom_app']
      );
      
      console.log(`User ${user.id} (${user.email}): ${sources.length} custom_app source(s)`);
      for (const src of sources) {
        console.log(`  - ID ${src.id}: "${src.displayName}" (status: ${src.status}, created: ${src.createdAt})`);
      }
    }
  } finally {
    await conn.release();
    await pool.end();
  }
}

verifySources().catch(console.error);
