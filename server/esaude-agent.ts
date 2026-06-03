/**
 * E-SAÚDE Sync Agent
 * Sincroniza agendamentos bidirecionalamente entre o site e a Clínica App
 * - Site → E-SAÚDE: Envia novos agendamentos
 * - E-SAÚDE → Site: Recebe atualizações de status
 */

import { getDb } from "./db";
import { syncLogs, sessions } from "../drizzle/schema";
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
 */
async function syncSiteToESaude(appointmentId: number): Promise<boolean> {
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

    // Validar dados
    const validation = validateAppointmentData({
      customer_name: appointment.patientId?.toString() || "",
      customer_email: "",
      appointment_date: new Date(appointment.scheduledAt).toISOString().split('T')[0],
      appointment_time: new Date(appointment.scheduledAt).toISOString().split('T')[1]?.substring(0, 5),
    });

    if (!validation.valid) {
      await db
        .update(syncLogs)
        .set({
          status: "failed",
          errorMessage: validation.error,
        })
        .where(eq(syncLogs.appointmentId, appointmentId));
      return false;
    }

    // Chamar E-SAÚDE com retry
    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${ESAUDE_API_URL}/webhooks.createDirectBooking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: `patient_${appointment.patientId}`,
          customer_name: `Patient ${appointment.patientId}`,
          customer_email: `patient${appointment.patientId}@clinic.local`,
          customer_phone: "",
          appointment_date: new Date(appointment.scheduledAt).toISOString().split('T')[0],
          appointment_time: new Date(appointment.scheduledAt).toISOString().split('T')[1]?.substring(0, 5),
          session_type: appointment.sessionType || "presencial",
          service_type: "Consulta Psicológica",
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
      .set({ notes: `esaudeId: ${esaudeId}` })
      .where(eq(sessions.id, appointmentId));

    // Registrar sucesso
    await db
      .update(syncLogs)
      .set({
        status: "success",
        esaudeId,
      })
      .where(eq(syncLogs.appointmentId, appointmentId));

    console.log(`[Success] Agendamento ${appointmentId} sincronizado com E-SAÚDE (${esaudeId})`);
    agentStatus.successCount++;
    return true;
  } catch (error) {
    console.error(`[Error] Falha ao sincronizar agendamento ${appointmentId}:`, error);

    // Atualizar log com erro
    const db = await getDb();
    if (db) {
      const [log] = await db
        .select()
        .from(syncLogs)
        .where(eq(syncLogs.appointmentId, appointmentId))
        .limit(1);

      const newRetryCount = (log?.retryCount || 0) + 1;

      if (newRetryCount >= MAX_RETRIES) {
        await db
          .update(syncLogs)
          .set({
            status: "failed",
            errorMessage: String(error),
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
        await db
          .update(syncLogs)
          .set({
            status: "retry",
            errorMessage: String(error),
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
    const [localAppointment] = await db
      .select()
      .from(sessions)
      .where(sql`notes LIKE ${"%" + appointment.id + "%"}`) 
      .limit(1);

    if (!localAppointment) {
      console.warn(
        `[Webhook] Agendamento não encontrado: ${appointment.customer_email} em ${appointment.appointment_date} ${appointment.appointment_time}`
      );
      return false;
    }

    // Mapear ações
    let newStatus = "pending";
    if (action === "appointment.confirmed") newStatus = "confirmed";
    if (action === "appointment.cancelled") newStatus = "cancelled";
    if (action === "appointment.updated") newStatus = "updated";

    // Atualizar agendamento
    await db
      .update(sessions)
      .set({
        status: newStatus as any,
        notes: `esaudeId: ${appointment.id}`,
        updatedAt: new Date(),
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
      `[Webhook] Agendamento ${localAppointment.id} atualizado: ${action} (${newStatus})`
    );
    agentStatus.successCount++;
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

export { syncSiteToESaude, processESaudeWebhook, syncPendingAppointments };
