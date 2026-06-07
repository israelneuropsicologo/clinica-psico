import bcrypt from "bcryptjs";
import { getDb } from "../db.js";
import { internalUsers, roles } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

/**
 * Hash de senha com bcrypt
 * @param password Senha em texto plano
 * @returns Hash da senha
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifica se a senha corresponde ao hash
 * @param password Senha em texto plano
 * @param hash Hash da senha armazenado
 * @returns true se a senha é válida
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Cria um novo usuário interno
 * @param clinicId ID da clínica
 * @param email Email do usuário
 * @param password Senha em texto plano
 * @param name Nome do usuário
 * @param roleId ID do papel/função
 * @returns Usuário criado ou erro
 */
export async function createInternalUser(
  clinicId: number,
  email: string,
  password: string,
  name: string,
  roleId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Verificar se email já existe
  const existing = await db
    .select()
    .from(internalUsers)
    .where(eq(internalUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Email já cadastrado");
  }

  // Hash da senha
  const passwordHash = await hashPassword(password);

  // Criar usuário
  const result = await db.insert(internalUsers).values({
    clinicId,
    email,
    passwordHash,
    name,
    roleId,
    isActive: true,
  });

  return result;
}

/**
 * Faz login com email e senha
 * @param email Email do usuário
 * @param password Senha em texto plano
 * @returns Usuário se válido, null caso contrário
 */
export async function loginInternalUser(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Buscar usuário
  const users = await db
    .select()
    .from(internalUsers)
    .where(eq(internalUsers.email, email))
    .limit(1);

  if (users.length === 0) {
    return null; // Email não encontrado
  }

  const user = users[0];

  // Verificar se está ativo
  if (!user.isActive) {
    return null; // Usuário desativado
  }

  // Verificar senha
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null; // Senha incorreta
  }

  // Atualizar lastLogin
  await db
    .update(internalUsers)
    .set({ lastLogin: new Date() })
    .where(eq(internalUsers.id, user.id));

  return user;
}

/**
 * Busca usuário interno por ID
 * @param id ID do usuário
 * @returns Usuário ou null
 */
export async function getInternalUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const users = await db
    .select()
    .from(internalUsers)
    .where(eq(internalUsers.id, id))
    .limit(1);

  return users[0] || null;
}

/**
 * Busca usuário interno por email
 * @param email Email do usuário
 * @returns Usuário ou null
 */
export async function getInternalUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const users = await db
    .select()
    .from(internalUsers)
    .where(eq(internalUsers.email, email))
    .limit(1);

  return users[0] || null;
}

/**
 * Busca role com suas permissões
 * @param roleId ID do papel
 * @returns Role com permissões
 */
export async function getRoleWithPermissions(roleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const roleData = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  return roleData[0] || null;
}
