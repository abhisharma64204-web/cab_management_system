const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSeed() {
  const dbName = process.env.DB_NAME || 'cab_management';
  console.log(`\n========================================`);
  console.log(`🚀 Starting Database Seeder`);
  console.log(`Target Database: ${dbName}`);
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`========================================\n`);

  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' ? { rejectUnauthorized: false } : undefined,
  };

  let connection;

  try {
    // 1. Connect to MySQL server
    try {
      connection = await mysql.createConnection({ ...baseConfig, database: dbName });
      console.log(`✅ Connected directly to database '${dbName}'.`);
    } catch (err) {
      console.log(`ℹ️ Direct connection to '${dbName}' failed (${err.message}). Connecting without database...`);
      connection = await mysql.createConnection(baseConfig);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await connection.query(`USE \`${dbName}\`;`);
      console.log(`✅ Database '${dbName}' created / selected.`);
    }

    // 2. Read schema.sql
    const schemaPath = path.resolve(__dirname, '..', 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log(`📄 Reading schema from: ${schemaPath}`);
      let schemaSql = fs.readFileSync(schemaPath, 'utf8');

      // Strip DROP/CREATE/USE cab_management statements so it works with any database name & cloud providers
      schemaSql = schemaSql
        .replace(/DROP DATABASE IF EXISTS [^;]+;/gi, '')
        .replace(/CREATE DATABASE [^;]+;/gi, '')
        .replace(/USE [^;]+;/gi, '');

      console.log('⚙️ Executing schema (tables creation)...');
      await connection.query(schemaSql);
      console.log('✅ Tables created successfully.');
    } else {
      console.warn(`⚠️ Warning: schema.sql not found at ${schemaPath}`);
    }

    // 3. Read seed.sql
    const seedPath = path.resolve(__dirname, '..', 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log(`📄 Reading seed data from: ${seedPath}`);
      let seedSql = fs.readFileSync(seedPath, 'utf8');

      // Strip USE statement and any trailing SELECT verification query
      seedSql = seedSql
        .replace(/USE [^;]+;/gi, '')
        .replace(/SELECT\s+'ADMIN'[\s\S]*?;/gi, '');

      console.log('🌱 Inserting seed data...');
      await connection.query(seedSql);
      console.log('✅ Seed data inserted successfully.');

      // Print row count summary
      console.log('\n📊 Database Row Summary:');
      const tables = ['ADMIN', 'CUSTOMER', 'DRIVER', 'RIDE', 'PAYMENT', 'FEEDBACK'];
      for (const tbl of tables) {
        try {
          const [[result]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${tbl}\``);
          console.log(`   - ${tbl.padEnd(10)} : ${result.count} rows`);
        } catch (e) {
          // table might not exist
        }
      }
    } else {
      console.warn(`⚠️ Warning: seed.sql not found at ${seedPath}`);
    }

    console.log(`\n🎉 Database setup and seeding completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌ Error during database seeding:`, error.message);
    if (error.sql) {
      console.error(`Failed Query:\n${error.sql.slice(0, 300)}...`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run seeder
runSeed();

