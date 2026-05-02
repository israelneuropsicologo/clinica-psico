import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL não configurada");
  process.exit(1);
}

async function applyMigration() {
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);

    console.log("Aplicando migration: lgpd_audit_logs...");

    // Verificar se a tabela já existe
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'lgpd_audit_logs'"
    );

    if (tables.length > 0) {
      console.log("✓ Tabela lgpd_audit_logs já existe");
      return;
    }

    // Criar a tabela
    await connection.execute(`
      CREATE TABLE \`lgpd_audit_logs\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`userId\` int NOT NULL,
        \`eventType\` varchar(50) NOT NULL,
        \`resourceType\` varchar(50) NOT NULL,
        \`resourceId\` varchar(255) NOT NULL,
        \`action\` varchar(20) NOT NULL,
        \`dataClassification\` varchar(50) NOT NULL,
        \`description\` text NOT NULL,
        \`details\` text,
        \`ipAddress\` varchar(45),
        \`userAgent\` text,
        \`status\` varchar(20) NOT NULL,
        \`errorMessage\` text,
        \`timestamp\` timestamp NOT NULL DEFAULT (now()),
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT \`lgpd_audit_logs_id\` PRIMARY KEY(\`id\`)
      );
    `);

    console.log("✓ Tabela lgpd_audit_logs criada com sucesso");
  } catch (error) {
    console.error("Erro ao aplicar migration:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyMigration();
