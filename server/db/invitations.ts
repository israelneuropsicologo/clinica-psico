import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * Gera um token seguro para o convite
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Cria um novo convite para um paciente
 * @param patientId ID do paciente
 * @param userId ID do psicólogo que criou
 * @param expiresInDays Dias até expiração (padrão: 30)
 */
export async function createInvitation(
  patientId: number,
  userId: number,
  expiresInDays: number = 30
) {
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

    patientId,
    userId,
    token,
    expiresAt,
    status: "pending",
  });

  return {
    id: result[0],
    token,
    expiresAt,
  };
}

/**
 * Valida um token de convite
 * @param token Token do convite
 */
export async function validateInvitationToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const invitation = await db
    .select()
    .limit(1);

  if (!invitation || invitation.length === 0) {
    return { valid: false, error: "Token inválido" };
  }

  const inv = invitation[0];

  // Verificar se já foi completado
  if (inv.status === "completed") {
    return { valid: false, error: "Este convite já foi preenchido" };
  }

  // Verificar se expirou
  if (new Date() > inv.expiresAt) {
    // Marcar como expirado
    await db
      .set({ status: "expired" })

    return { valid: false, error: "Este convite expirou" };
  }

  return { valid: true, invitation: inv };
}

/**
 * Obtém dados do paciente para edição pelo convite
 * @param token Token do convite
 */
export async function getPatientByInvitationToken(token: string) {
  const validation = await validateInvitationToken(token);

  if (!validation.valid) {
    return { error: validation.error };
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const patient = await db
    .select()
    .limit(1);

  if (!patient || patient.length === 0) {
    return { error: "Paciente não encontrado" };
  }

  return { patient: patient[0], invitation: validation.invitation };
}

/**
 * Atualiza dados do paciente via convite
 * @param token Token do convite
 * @param data Dados a atualizar
 */
export async function updatePatientFromInvitation(
  token: string,
  data: Record<string, any>
) {
  const validation = await validateInvitationToken(token);

  if (!validation.valid) {
    return { error: validation.error };
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const patientId = validation.invitation!.patientId;

  // Atualizar paciente
  await db
    .set({
      ...data,
      updatedAt: new Date(),
    })

  // Marcar convite como completado
  await db
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })

  return { success: true, patientId };
}

/**
 * Lista convites de um psicólogo
 * @param userId ID do psicólogo
 */
export async function listInvitationsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
    })
}

/**
 * Obtém um convite específico
 * @param invitationId ID do convite
 */
export async function getInvitationById(invitationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .limit(1);

  return result[0] || null;
}

/**
 * Revoga um convite (marca como expirado)
 * @param invitationId ID do convite
 */
export async function revokeInvitation(invitationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .set({
      status: "expired",
      updatedAt: new Date(),
    })

  return { success: true };
}
