import { getDb } from "./server/db.js";
import { roles, permissions, rolePermissions } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = await getDb();

// Permissions padrão
const defaultPermissions = [
  { name: "patients.view", description: "Visualizar pacientes", category: "patients" },
  { name: "patients.create", description: "Criar pacientes", category: "patients" },
  { name: "patients.edit", description: "Editar pacientes", category: "patients" },
  { name: "patients.delete", description: "Deletar pacientes", category: "patients" },
  { name: "sessions.view", description: "Visualizar sessões", category: "sessions" },
  { name: "sessions.create", description: "Criar sessões", category: "sessions" },
  { name: "sessions.edit", description: "Editar sessões", category: "sessions" },
  { name: "sessions.delete", description: "Deletar sessões", category: "sessions" },
  { name: "financial.view", description: "Visualizar financeiro", category: "financial" },
  { name: "financial.edit", description: "Editar financeiro", category: "financial" },
  { name: "users.view", description: "Visualizar usuários", category: "users" },
  { name: "users.create", description: "Criar usuários", category: "users" },
  { name: "users.edit", description: "Editar usuários", category: "users" },
  { name: "users.delete", description: "Deletar usuários", category: "users" },
  { name: "reports.view", description: "Visualizar relatórios", category: "reports" },
  { name: "settings.edit", description: "Editar configurações", category: "settings" },
];

// Roles padrão
const defaultRoles = [
  { name: "Secretária", description: "Gerencia pacientes e agendamentos", clinicId: 1 },
  { name: "Financeiro", description: "Gerencia financeiro e relatórios", clinicId: 1 },
  { name: "Assistente", description: "Suporte geral", clinicId: 1 },
];

console.log("Inserindo permissions...");
for (const perm of defaultPermissions) {
  try {
    await db.insert(permissions).values(perm);
    console.log(`✓ ${perm.name}`);
  } catch (e) {
    console.log(`✗ ${perm.name} (já existe)`);
  }
}

console.log("\nInserindo roles...");
for (const role of defaultRoles) {
  try {
    await db.insert(roles).values(role);
    console.log(`✓ ${role.name}`);
  } catch (e) {
    console.log(`✗ ${role.name} (já existe)`);
  }
}

console.log("\nDone!");
