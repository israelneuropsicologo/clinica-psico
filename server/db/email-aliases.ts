import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { emailAliases, users } from "../../drizzle/schema";

/**
 * Adicionar um email alias a um usuário
 */
export async function addEmailAlias(userId: number, email: string, isPrimary = false): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // Verificar se o usuário existe
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.length === 0) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Adicionar alias
  await db.insert(emailAliases).values({
    userId,
    email,
    isPrimary,
  });

  console.log(`[Email Alias] Added alias ${email} to user ${userId}`);
}

/**
 * Remover um email alias
 */
export async function removeEmailAlias(email: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  await db.delete(emailAliases).where(eq(emailAliases.email, email));

  console.log(`[Email Alias] Removed alias ${email}`);
}

/**
 * Listar todos os aliases de um usuário
 */
export async function getUserEmailAliases(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const aliases = await db
    .select()
    .from(emailAliases)
    .where(eq(emailAliases.userId, userId));

  return aliases.map((a) => a.email);
}

/**
 * Vincular dois emails ao mesmo usuário
 * O email secundário se torna um alias do email principal
 */
export async function linkEmailsToUser(primaryUserId: number, secondaryEmail: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // Verificar se o email secundário já existe como usuário
  const secondaryUser = await db
    .select()
    .from(users)
    .where(eq(users.email, secondaryEmail))
    .limit(1);

  if (secondaryUser && secondaryUser.length > 0) {
    // Se o email secundário já é um usuário, mesclar os dados
    console.log(`[Email Linking] Email ${secondaryEmail} is already a user, adding as alias to user ${primaryUserId}`);
  }

  // Adicionar o email secundário como alias do usuário principal
  await addEmailAlias(primaryUserId, secondaryEmail, false);
}
