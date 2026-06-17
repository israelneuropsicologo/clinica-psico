import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function listUsers() {
  let connection;

  try {
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
    };

    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados\n');

    const [users] = await connection.execute('SELECT id, email FROM users');
    
    console.log('📋 Usuários no banco de dados:');
    console.log('─'.repeat(50));
    users.forEach(user => {
      console.log(`ID: ${user.id} | Email: ${user.email}`);
    });
    console.log('─'.repeat(50));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

listUsers();
