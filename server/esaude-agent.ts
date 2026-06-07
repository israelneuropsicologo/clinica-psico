/**
 * E-SAÚDE Sync Agent
 * Sincroniza agendamentos bidirecionalamente entre o site e a Clínica App
 * - Site → E-SAÚDE: Envia novos agendamentos
 * - E-SAÚDE → Site: Recebe atualizações de status
 */

import { getDb } from "./db";
import { syncLogs, sessions, patients, apiTokens } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

// ─── Types ─────────────────────────────────────────────────────────────────
interface ESaudeAppointment {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  session_type: string;
  status: string;
  notes?: string;
}

interface WebhookPayload {
  action: "appointment.confirmed" | "appointment.cancelled" | "appointment.updated";
  appointment: ESaudeAppointment;
  token: string;
}

interface AgentStatus {
  isRunning: boolean;
  lastSync: Date | null;
  pendingCount: number;
  successCount: number;
  failureCount: number;
  uptime: number;
}

// ─── Global State ──────────────────────────────────────────────────────────
let agentStatus: AgentStatus = {
  isRunning: false,
  lastSync: null,
  pendingCount: 0,
  successCount: 0,
  failureCount: 0,
  uptime: 0,
};

let syncInterval: NodeJS.Timeout | null = null;
const SYNC_INTERVAL = 30 * 1000; // 30 segundos
const MAX_RETRIES = 5;
const ESAUDE_API_URL = "https://3000-iqeml0nzkls9iuio3yj0h-beff8383.us2.manus.computer/api/trpc";

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Validar dados do agendamento
 */
function validateAppointmentData(data: any): { valid: boolean; error?: string } {
  if (!data.customer_name || data.customer_name.trim().length < 8) {
    return { valid: false, error: "Nome deve ter 8+ caracteres (sem espaços)" };
  }
  if (!data.customer_email || !data.customer_email.includes("@")) {
    return { valid: false, error: "Email inválido" };
  }
  if (!data.appointment_date || !data.appointment_time) {
    return { valid: false, error: "Data e hora são obrigatórias" };
  }
  // ✅ NOVO: Validar telefone obrigatório
  if (!data.customer_phone || data.customer_phone.trim().length === 0) {
    return { valid: false, error: "Telefone é obrigatório para sincronização com E-SAÚDE" };
  }
  return { valid: true };
}

/**
 * Fazer retry com exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
        console.log(`[Retry] Tentativa ${attempt + 1}/${maxRetries} em ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ─── Sync Functions ────────────────────────────────────────────────────────

/**
 * Sincronizar agendamento do site para E-SAÚDE
 * Exportada para uso em outros módulos
 */
export async function syncSiteToESaude(appointmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Buscar agendamento
    const [appointment] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, appointmentId))
      .limit(1);

    if (!appointment) {
      throw new Error(`Agendamento ${appointmentId} não encontrado`);
    }

    // Buscar dados do paciente
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, appointment.patientId))
      .limit(1);

    if (!patient) {
      throw new Error(`Paciente ${appointment.patientId} não encontrado`);
    }

    // Validar dados
    const appointmentDate = new Date(appointment.scheduledAt);
    const validation = validateAppointmentData({
      customer_name: patient.name || "",
      customer_email: patient.email || "",
      customer_phone: patient.phone || "",
      appointment_date: appointmentDate.toISOString().split('T')[0],
      appointment_time: appointmentDate.toISOString().split('T')[1]?.substring(0, 5),
    });

    if (!validation.valid) {
      console.warn(`[Validation] Agendamento ${appointmentId} rejeitado: ${validation.error}`);
      console.warn(`[Validation] Dados: name=${patient.name}, email=${patient.email}, phone=${patient.phone}`);
      
      // Buscar sync log para verificar se já foi notificado
      const [existingLog] = await db
        .select()
        .from(syncLogs)
        .where(eq(syncLogs.appointmentId, appointmentId))
        .limit(1);
      
      // Marcar como rejeitado permanentemente (não tentar novamente)
      // Truncar erro para caber na coluna do banco (max 500 caracteres)
      const truncatedError = (validation.error || "Dados inválidos").substring(0, 500);
      await db
        .update(syncLogs)
        .set({
          status: "failed",
          errorMessage: truncatedError,
          retryCount: 999, // Marcar como esgotado para não tentar novamente
        })
        .where(eq(syncLogs.appointmentId, appointmentId));
      
      // Notificar admin sobre dados incompletos
      if (!existingLog) {
        await notifyOwner({
          title: "⚠️ Agendamento com dados incompletos",
          content: `Agendamento ${appointmentId} foi rejeitado: ${validation.error}\n\nPaciente: ${patient.name}\nEmail: ${patient.email}\nTelefone: ${patient.phone || "(vazio)"}`,
        }).catch(() => {});
      }
      
      return false;
    }

    // Buscar token de API válido
    const apiTokenRecord = await db
      .select()
      .from(apiTokens)
      .where(and(
        eq(apiTokens.userId, appointment.userId),
        eq(apiTokens.isActive, 1)
      ))
      .limit(1);

    const apiToken = apiTokenRecord?.[0]?.token;
    if (!apiToken) {
      throw new Error(`Nenhum token de API valido encontrado para userId ${appointment.userId}`);
    }

    // Chamar E-SAÚDE com retry
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${ESAUDE_API_URL}/webhooks.createDirectBooking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: apiToken,
          customer_id: patient.externalCustomerId || `patient_${appointment.patientId}`,
          customer_name: patient.name,
          customer_email: patient.email,
          customer_phone: patient.phone || "",
          appointment_date: appointmentDate.toISOString().split('T')[0],
          appointment_time: appointmentDate.toISOString().split('T')[1]?.substring(0, 5),
          session_type: appointment.modality === "online" ? "virtual" : "presencial",
          service_type: appointment.sessionType || "Consulta Psicológica",
          notes: appointment.notes || "",
        }),
      });

      if (!res.ok) {
        throw new Error(`E-SAÚDE retornou ${res.status}: ${await res.text()}`);
      }

      return res.json();
    });

      // Atualizar session com esaudeId (salvar em notes)
    const esaudeId = response.id || response.esaudeId || `appt_${appointmentId}_${Date.now()}`;
    await db
      .update(sessions)
      .set({ notes: `esaudeId: ${esaudeId}\nSincronizado com E-SAÚDE` })
      .where(eq(sessions.id, appointmentId));

    // Registrar sucesso
    await db
      .update(syncLogs)
      .set({
        status: "success",
        esaudeId,
        errorMessage: null,
      })
      .where(eq(syncLogs.appointmentId, appointmentId));

    console.log(`[Success] Agendamento ${appointmentId} sincronizado com E-SAÚDE (${esaudeId})`);
    agentStatus.successCount++;
    return true;
  } catch (error) {
    console.error(`[Error] Falha ao sincronizar agendamento ${appointmentId}:`, error);

      // Atualizar log com erro
    const dbForError = await getDb();
    if (dbForError) {
      const logsForError = await dbForError
        .select()
        .from(syncLogs)
        .where(eq(syncLogs.appointmentId, appointmentId))
        .limit(1);

      const log = logsForError?.[0];
      const newRetryCount = (log?.retryCount || 0) + 1;
      
      // Truncar erro para caber na coluna do banco (max 500 caracteres)
      const truncatedError = String(error).substring(0, 500);

      if (newRetryCount >= MAX_RETRIES) {
        await dbForError
          .update(syncLogs)
          .set({
            status: "failed",
            errorMessage: truncatedError,
            retryCount: newRetryCount,
          })
          .where(eq(syncLogs.appointmentId, appointmentId));

        // Notificar admin após muitas tentativas
        await notifyOwner({
          title: "❌ Falha na Sincronização E-SAÚDE",
          content: `Agendamento ${appointmentId} falhou após ${MAX_RETRIES} tentativas. Erro: ${error}`,
        }).catch(() => {});

        agentStatus.failureCount++;
      } else {
        await dbForError
          .update(syncLogs)
          .set({
            status: "retry",
            errorMessage: truncatedError,
            retryCount: newRetryCount,
          })
          .where(eq(syncLogs.appointmentId, appointmentId));
      }
    }

    return false;
  }
}

/**
 * Processar webhook de E-SAÚDE
 */
async function processESaudeWebhook(payload: WebhookPayload): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Validar token
    const expectedToken = process.env.ESAUDE_WEBHOOK_SECRET;
    if (payload.token !== expectedToken) {
      throw new Error("Token inválido");
    }

    const { action, appointment } = payload;

    // Buscar agendamento local pelo esaudeId
    let [localAppointment] = await db
      .select()
      .from(sessions)
      .where(sql`notes LIKE ${"% " + appointment.id + "%"}`) 
      .limit(1);

    // Se não existe, CRIAR novo agendamento
    if (!localAppointment) {
      console.log(
        `[Webhook] Agendamento novo: ${appointment.customer_email} em ${appointment.appointment_date} ${appointment.appointment_time}`
      );
      
      // Buscar ou criar paciente
      const existingPatients = await db
        .select()
        .from(patients)
        .where(eq(patients.email, appointment.customer_email))
        .limit(1);
      
      let patientId = existingPatients?.[0]?.id;
      if (!patientId) {
        const patientResult = await db
          .insert(patients)
          .values({
            name: appointment.customer_name,
            email: appointment.customer_email,
            phone: appointment.customer_phone,
            leadSource: "chatbot",
            userId: 1,
          });
        patientId = (patientResult[0] as { insertId: number }).insertId;
      }
      
      // Criar agendamento
      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const sessionResult = await db
        .insert(sessions)
        .values({
          patientId,
          userId: 1,
          scheduledAt: appointmentDateTime.getTime(),
          durationMinutes: 50,
          status: "confirmed",
          sessionType: "individual",
          modality: "in_person",
          notes: `esaudeId: ${appointment.id}\nOrigem: Chatbot Amanda`,
        });
      
      const newSessionId = (sessionResult[0] as { insertId: number }).insertId;
      localAppointment = { id: Number(newSessionId) } as any;
      console.log(`[Webhook] Agendamento criado: ${newSessionId}`);
    }

    // Mapear ações
    let newStatus = "confirmed"; // Padrão é confirmado
    if (action === "appointment.confirmed") newStatus = "confirmed";
    if (action === "appointment.cancelled") newStatus = "cancelled";
    if (action === "appointment.updated") newStatus = "confirmed";

    // Atualizar agendamento
    await db
      .update(sessions)
      .set({
        status: newStatus as any,
        notes: `esaudeId: ${appointment.id}\nOrigem: Chatbot Amanda`,
      })
      .where(eq(sessions.id, localAppointment.id));

    // Registrar sincronização
    await db.insert(syncLogs).values({
      appointmentId: localAppointment.id,
      direction: "esaude_to_site",
      status: "success",
      esaudeId: appointment.id,
    });

    console.log(
      `[Webhook] Agendamento ${localAppointment.id} processado: ${action} (${newStatus})`
    );
    agentStatus.successCount++;
    agentStatus.lastSync = new Date();
    return true;
  } catch (error) {
    console.error("[Webhook] Erro ao processar:", error);
    agentStatus.failureCount++;
    return false;
  }
}

/**
 * Sincronizar agendamentos pendentes
 */
async function syncPendingAppointments(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar agendamentos pendentes
    const pendingLogs = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.status, "pending"))
      .limit(10);

    agentStatus.pendingCount = pendingLogs.length || 0;

    for (const log of pendingLogs) {
      await syncSiteToESaude(log.appointmentId);
    }

    agentStatus.lastSync = new Date();
  } catch (error) {
    console.error("[Sync] Erro ao sincronizar:", error);
  }
}

// ─── Agent Lifecycle ───────────────────────────────────────────────────────

/**
 * Inicializar agente E-SAÚDE
 */
export function initializeESaudeAgent(): void {
  if (agentStatus.isRunning) {
    console.log("[Agent] Já está rodando");
    return;
  }

  console.log("[Agent] Iniciando agente E-SAÚDE...");
  agentStatus.isRunning = true;
  agentStatus.uptime = Date.now();

  // Sincronizar imediatamente
  syncPendingAppointments().catch(console.error);

  // Configurar intervalo periódico
  syncInterval = setInterval(() => {
    syncPendingAppointments().catch(console.error);
  }, SYNC_INTERVAL);

  console.log("[Agent] ✅ Agente E-SAÚDE ativado!");
}

/**
 * Parar agente E-SAÚDE
 */
export function stopESaudeAgent(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  agentStatus.isRunning = false;
  console.log("[Agent] Agente E-SAÚDE parado");
}

// ─── Webhook Handler ───────────────────────────────────────────────────────

/**
 * Handler para webhook de E-SAÚDE
 */
export async function handleESaudeWebhook(req: any, res: any): Promise<void> {
  try {
    const payload = req.body as WebhookPayload;

    // Validar payload
    if (!payload.action || !payload.appointment || !payload.token) {
      res.status(400).json({ error: "Payload inválido" });
      return;
    }

    // Processar webhook
    const success = await processESaudeWebhook(payload);

    res.json({
      success,
      message: success ? "Webhook processado com sucesso" : "Falha ao processar webhook",
    });
  } catch (error) {
    console.error("[Webhook] Erro:", error);
    res.status(500).json({ error: String(error) });
  }
}

// ─── Status Endpoint ───────────────────────────────────────────────────────

/**
 * Obter status do agente
 */
export async function getAgentStatus(): Promise<AgentStatus> {
  const db = await getDb();
  if (!db) return agentStatus;

  try {
    const pendingLogs = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.status, "pending"));

    agentStatus.pendingCount = pendingLogs.length || 0;
  } catch (error) {
    console.error("[Status] Erro ao contar pendentes:", error);
  }

  return {
    ...agentStatus,
    uptime: agentStatus.isRunning ? Date.now() - (agentStatus.uptime as any) : 0,
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

export { processESaudeWebhook, syncPendingAppointments };
