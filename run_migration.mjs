import mysql from 'mysql2/promise';

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
  const sql = 'ALTER TABLE `user_profiles` ADD `startWeightLbs` int;';
  await connection.execute(sql);
  console.log('✓ Migration executed successfully');
  await connection.end();
} catch (error) {
  if (error.code === 'ER_DUP_FIELDNAME') {
    console.log('✓ Column already exists');
  } else {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}
