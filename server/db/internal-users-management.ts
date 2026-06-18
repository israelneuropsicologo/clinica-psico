import { getDb } from "../db.js";
import { internalUsers, roles } from "../../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Lista todos os usuários internos de uma clínica
 */
export async function getInternalUsersByClinic(clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const users = await db
    .select({
      id: internalUsers.id,
      email: internalUsers.email,
      name: internalUsers.name,
      roleId: internalUsers.roleId,
      isActive: internalUsers.isActive,
      createdAt: internalUsers.createdAt,
      lastLogin: internalUsers.lastLogin,
    })
    .from(internalUsers)
    .where(eq(internalUsers.clinicId, clinicId));

  return users;
}

/**
 * Atualiza um usuário interno
 */
export async function updateInternalUser(
  userId: number,
  updates: {
    name?: string;
    roleId?: number;
    isActive?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .update(internalUsers)
    .set(updates)
    .where(eq(internalUsers.id, userId));

  return result;
}

/**
 * Desativa um usuário interno (soft delete)
 */
export async function deactivateInternalUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .update(internalUsers)
    .set({ isActive: false })
    .where(eq(internalUsers.id, userId));
}

/**
 * Ativa um usuário interno
 */
export async function activateInternalUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .update(internalUsers)
    .set({ isActive: true })
    .where(eq(internalUsers.id, userId));
}

/**
 * Deleta um usuário interno (hard delete)
 */
export async function deleteInternalUserPermanently(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db.delete(internalUsers).where(eq(internalUsers.id, userId));
}

/**
 * Conta quantos usuários ativos uma clínica tem
 */
export async function countActiveInternalUsers(clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(internalUsers)
    .where(
      and(
        eq(internalUsers.clinicId, clinicId),
        eq(internalUsers.isActive, true)
      )
    );

  return result.length;
}
