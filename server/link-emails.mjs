#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não configurada');
  process.exit(1);
}

async function linkEmails() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🔗 Vinculando emails...');
    
    // 1. Obter ID do usuário principal
    console.log('1️⃣ Obtendo usuário principal...');
    const [users] = await connection.execute(
      `SELECT id FROM users WHERE email = ?`,
      ['israelneuropsicologo@gmail.com']
    );
    
    if (!users || users.length === 0) {
      console.error('❌ Usuário principal não encontrado');
      process.exit(1);
    }
    
    const userId = users[0].id;
    console.log(`✅ Usuário principal encontrado: ID ${userId}`);
    
    // 2. Adicionar email alias
    console.log('2️⃣ Adicionando email alias...');
    await connection.execute(
      `INSERT INTO email_aliases (userId, email, isPrimary) VALUES (?, ?, ?)`,
      [userId, 'israelmengo@gmail.com', false]
    );
    console.log(`✅ Email alias adicionado: israelmengo@gmail.com`);
    
    console.log('\n✨ Emails vinculados com sucesso!');
    console.log(`\n📋 Resumo:`);
    console.log(`   - Usuário principal: ID ${userId} (israelneuropsicolo@gmail.com)`);
    console.log(`   - Email alias: israelmengo@gmail.com`);
    console.log(`\n🎉 Agora ambos os emails acessarão a mesma conta!`);
    
  } catch (error) {
    console.error('❌ Erro ao vincular emails:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

linkEmails();
