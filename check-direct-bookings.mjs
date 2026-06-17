import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDirectBookings() {
  const dbUrl = process.env.DATABASE_URL;
  
  try {
    const url = new URL(dbUrl);
    const connection = await mysql.createConnection({
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
    });

    console.log('✅ Connected to database\n');

    // Check sessions with leadSource="direct_booking"
    const [sessions] = await connection.execute(`
      SELECT 
        s.id,
        s.status,
        s.scheduledAt,
        p.name,
        p.leadSource,
        p.email
      FROM sessions s
      INNER JOIN patients p ON s.patientId = p.id
      WHERE p.leadSource = 'direct_booking'
      ORDER BY s.createdAt DESC
      LIMIT 10
    `);

    console.log('📋 Direct Bookings in Database:');
    console.log(JSON.stringify(sessions, null, 2));

    if (sessions.length === 0) {
      console.log('\n⚠️  No direct bookings found!');
      
      // Check all patients
      const [allPatients] = await connection.execute(`
        SELECT leadSource, COUNT(*) as count
        FROM patients
        GROUP BY leadSource
      `);
      
      console.log('\n📊 Patients by Lead Source:');
      console.log(JSON.stringify(allPatients, null, 2));
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDirectBookings();
