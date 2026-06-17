import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
const parts = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
const [, user, pass, host, port, db] = parts;

const pool = mysql.createPool({
  host,
  user,
  password: pass,
  database: db,
  ssl: 'Amazon RDS',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const conn = await pool.getConnection();

// Buscar usuários
const [users] = await conn.query('SELECT id, email FROM users LIMIT 10');
console.log('Usuários:', users);

// Buscar vinculações
const [links] = await conn.query('SELECT * FROM user_links');
console.log('Vinculações:', links);

await conn.end();
