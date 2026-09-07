const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || undefined,
    });
    console.log('✅  Test connection successful');
    await conn.end();
  } catch (err) {
    console.error('❌  Test connection failed:', err.message);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
