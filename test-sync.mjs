import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'gateway06.us-east-1.prod.aws.tidbcloud.com',
  user: '3RpD4X9wDf1hcRV.root',
  password: 'YvzE946C24r6uycRkbXB',
  database: 'P4nfWouMd7MUucxFWnyo87',
  port: 4000,
  ssl: 'REQUIRED',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testSync() {
  const connection = await pool.getConnection();
  
  try {
    // Testar getLinkedUserIds para usuário 30001
    console.log('\n=== Testando getLinkedUserIds para usuário 30001 ===');
    
    // Buscar onde este usuário é primary
    const [primaryLinks] = await connection.query(
      'SELECT linkedUserId FROM user_links WHERE primaryUserId = ?',
      [30001]
    );
    console.log('Primary links:', primaryLinks);
    
    // Buscar onde este usuário é linked
    const [linkedByOthers] = await connection.query(
      'SELECT primaryUserId FROM user_links WHERE linkedUserId = ?',
      [30001]
    );
    console.log('Linked by others:', linkedByOthers);
    
    // Construir o array de IDs
    const allLinked = [
      30001,
      ...primaryLinks.map(l => l.linkedUserId),
      ...linkedByOthers.map(l => l.primaryUserId)
    ];
    const uniqueIds = [...new Set(allLinked)];
    console.log('Unique linked IDs:', uniqueIds);
    
    // Testar getPatientsShared
    console.log('\n=== Testando getPatientsShared para usuário 30001 ===');
    const [patients] = await connection.query(
      'SELECT COUNT(*) as count FROM patients WHERE userId IN (?) AND status = "active"',
      [uniqueIds]
    );
    console.log('Pacientes ativos compartilhados:', patients[0].count);
    
    // Testar getPatientCountShared
    console.log('\n=== Testando getPatientCountShared (SQL direto) ===');
    const [result] = await connection.query(
      'SELECT COUNT(*) as count FROM patients WHERE userId IN (?) AND status = "active"',
      [uniqueIds]
    );
    console.log('Resultado:', result[0].count);
    
  } finally {
    connection.release();
    await pool.end();
  }
}

testSync().catch(console.error);
