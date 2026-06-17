#!/usr/bin/env node

/**
 * Script para migrar dados existentes para o novo sistema de clínicas
 * Cria uma clínica padrão e vincula todos os usuários e dados a ela
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não configurada');
  process.exit(1);
}

async function migrate() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🔄 Iniciando migração de clínicas...');
    
    // 1. Obter primeiro usuário (será o proprietário da clínica)
    console.log('1️⃣ Obtendo primeiro usuário...');
    const [users] = await connection.execute(
      `SELECT id FROM users ORDER BY id LIMIT 1`
    );
    if (users.length === 0) {
      console.error('❌ Nenhum usuário encontrado no banco');
      process.exit(1);
    }
    const ownerId = users[0].id;
    console.log(`✅ Proprietário da clínica: ID ${ownerId}`);
    
    // 2. Criar clínica padrão
    console.log('2️⃣ Criando clínica padrão...');
    const [clinicResult] = await connection.execute(
      `INSERT INTO clinics (name, description, ownerId) VALUES (?, ?, ?)`,
      ['Clínica Padrão', 'Clínica criada automaticamente durante migração', ownerId]
    );
    const clinicId = clinicResult.insertId;
    console.log(`✅ Clínica criada com ID: ${clinicId}`);
    
    // 3. Atualizar todos os usuários para vincular à clínica
    console.log('3️⃣ Vinculando usuários à clínica...');
    const [updateResult] = await connection.execute(
      `UPDATE users SET clinicId = ? WHERE clinicId IS NULL`,
      [clinicId]
    );
    console.log(`✅ ${updateResult.affectedRows} usuários vinculados`);
    
    // 4. Atualizar tabela de configurações (settings) para usar clinicId
    console.log('4️⃣ Atualizando configurações...');
    let settingsResult = { affectedRows: 0 };
    try {
      const [result] = await connection.execute(
        `UPDATE settings SET clinicId = ? WHERE clinicId IS NULL`,
        [clinicId]
      );
      settingsResult = result;
      console.log(`✅ ${settingsResult.affectedRows} configurações atualizadas`);
    } catch (e) {
      console.log('⚠️ Coluna clinicId não existe em settings (será adicionada depois)');
    }
    
    console.log('✨ Migração concluída com sucesso!');
    console.log(`\n📋 Resumo:`);
    console.log(`   - Clínica criada: ID ${clinicId}`);
    console.log(`   - Proprietário: ID ${ownerId}`);
    console.log(`   - Usuários vinculados: ${updateResult.affectedRows}`);
    console.log(`   - Configurações atualizadas: ${settingsResult.affectedRows}`);
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
