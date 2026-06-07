#!/usr/bin/env node

/**
 * Script para vincular dois usuários
 * 
 * Uso: node link-users.mjs --primary 1 --linked 2
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não está definida');
  process.exit(1);
}

// Parse argumentos
const args = process.argv.slice(2);
let primaryUserId = 1;
let linkedUserId = 2;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--primary' && args[i + 1]) {
    primaryUserId = parseInt(args[i + 1]);
  }
  if (args[i] === '--linked' && args[i + 1]) {
    linkedUserId = parseInt(args[i + 1]);
  }
}

async function linkUsers() {
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
    };

    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados');

    // Verificar se os usuários existem
    console.log(`\n🔍 Verificando usuários...`);
    const [users] = await connection.execute(
      'SELECT id, email FROM users WHERE id IN (?, ?)',
      [primaryUserId, linkedUserId]
    );

    if (users.length < 2) {
      console.error(`❌ Erro: Um ou ambos os usuários não existem`);
      console.error(`Usuários encontrados:`, users);
      process.exit(1);
    }

    console.log(`✅ Usuário 1 (Primary): ${users[0].email}`);
    console.log(`✅ Usuário 2 (Linked): ${users[1].email}`);

    // Vincular usuários
    console.log(`\n🔄 Vinculando usuários...`);
    await connection.execute(
      'INSERT INTO user_links (primaryUserId, linkedUserId) VALUES (?, ?) ON DUPLICATE KEY UPDATE createdAt = createdAt',
      [primaryUserId, linkedUserId]
    );

    console.log(`✅ Usuários vinculados com sucesso!`);

    // Verificar vínculo
    const [links] = await connection.execute(
      'SELECT * FROM user_links WHERE primaryUserId = ? AND linkedUserId = ?',
      [primaryUserId, linkedUserId]
    );

    if (links.length > 0) {
      console.log(`\n✅ Vínculo confirmado:`);
      console.log(`   ID: ${links[0].id}`);
      console.log(`   Criado em: ${links[0].createdAt}`);
    }

    console.log('\n📋 Próximos passos:');
    console.log('1. Fazer login com ambas as contas');
    console.log('2. Verificar que ambas veem os mesmos pacientes');
    console.log('3. Executar testes: pnpm test');

  } catch (error) {
    console.error('❌ Erro ao vincular usuários:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

linkUsers();
