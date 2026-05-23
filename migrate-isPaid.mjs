#!/usr/bin/env node
/**
 * Migration Script: Fix isPaid column type from boolean to enum
 * This script converts the isPaid column in the sessions table from boolean to enum('pending','paid','waived')
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  try {
    // Parse the database URL
    const url = new URL(dbUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
    });

    console.log('✅ Connected to database');

    // Execute the migration
    const migrationSQL = `ALTER TABLE \`sessions\` MODIFY COLUMN \`isPaid\` enum('pending','paid','waived') NOT NULL DEFAULT 'pending'`;
    
    console.log('🔄 Executing migration...');
    console.log('SQL:', migrationSQL);
    
    await connection.execute(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ isPaid column is now enum(\'pending\',\'paid\',\'waived\')');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
