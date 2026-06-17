import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não está definida');
  process.exit(1);
}

async function applyMigrations() {
  let connection;

  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false }, // SSL com verificação desabilitada
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados');

    // Migração 1: Adicionar externalCustomerId aos pacientes
    console.log('🔄 Aplicando migração 1: externalCustomerId...');
    try {
      await connection.execute(
        `ALTER TABLE \`patients\` ADD \`externalCustomerId\` varchar(255)`
      );
      await connection.execute(
        `ALTER TABLE \`patients\` ADD CONSTRAINT \`patients_externalCustomerId_unique\` UNIQUE(\`externalCustomerId\`)`
      );
      console.log('✅ Migração 1 aplicada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo externalCustomerId já existe');
      } else {
        throw error;
      }
    }

    // Migração 2: Criar tabela user_links
    console.log('🔄 Aplicando migração 2: user_links...');
    try {
      await connection.execute(`
        CREATE TABLE \`user_links\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`primaryUserId\` int NOT NULL,
          \`linkedUserId\` int NOT NULL,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`user_links_id\` PRIMARY KEY(\`id\`)
        )
      `);
      console.log('✅ Migração 2 aplicada: tabela user_links criada');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('ℹ️  Tabela user_links já existe');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Todas as migrações aplicadas com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Vincular as duas contas:');
    console.log('   node link-users.mjs --primary 1 --linked 2');
    console.log('\n2. Validar sincronização:');
    console.log('   pnpm test');

  } catch (error) {
    console.error('❌ Erro ao aplicar migrações:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyMigrations();
