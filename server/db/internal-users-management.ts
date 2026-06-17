import { getDb } from "../db.js";
import { eq, and } from "drizzle-orm";

/**
 * Lista todos os usuários internos de uma clínica
 */
export async function getInternalUsersByClinic(clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const users = await db
    .select({
    })

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
    .set(updates)

  return result;
}

/**
 * Desativa um usuário interno (soft delete)
 */
export async function deactivateInternalUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .set({ isActive: false })
}

/**
 * Ativa um usuário interno
 */
export async function activateInternalUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .set({ isActive: true })
}

/**
 * Deleta um usuário interno (hard delete)
 */
export async function deleteInternalUserPermanently(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

}

/**
 * Conta quantos usuários ativos uma clínica tem
 */
export async function countActiveInternalUsers(clinicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .where(
      and(
      )
    );

  return result.length;
}
