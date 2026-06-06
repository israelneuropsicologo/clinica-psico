/**
 * Sincroniza agendamentos confirmados por Amanda para E-SAÚDE
 * Chamado quando Amanda confirma um agendamento com o cliente
 */

import { notifyOwner } from "./_core/notification";

interface AmandaAppointmentData {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  consultationType: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  sessionType: "presencial" | "online";
  notes?: string;
}

/**
 * Sincroniza agendamento de Amanda para E-SAÚDE
 * Chamado por Amanda quando um agendamento é confirmado
 */
export async function syncAppointmentToClinicaApp(data: AmandaAppointmentData) {
  try {
    console.log(`[SYNC AMANDA] Sincronizando agendamento de Amanda:`, {
      appointmentId: data.appointmentId,
      patientName: data.patientName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
    });

    // Token de Amanda para se autenticar com E-SAÚDE
    const AMANDA_TOKEN = process.env.ESAUDE_AGENT_TOKEN || "sk_tx19tplq8go4z2awfemx";

    // URL de E-SAÚDE
    const ESAUDE_URL = process.env.BUILT_IN_FORGE_API_URL || "https://sistemaclinicaapp.manus.space";

    // Endpoint que E-SAÚDE espera receber
    const endpoint = `${ESAUDE_URL}/api/trpc/webhooks.createDirectBooking`;

    // Preparar payload no formato tRPC
    const payload = {
      json: {
        token: AMANDA_TOKEN,
        customer_id: `amanda_${data.appointmentId}`,
        customer_name: data.patientName,
        customer_email: data.patientEmail,
        customer_phone: data.patientPhone || "",
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        session_type: data.sessionType === "online" ? "online" : "presencial",
        service_type: data.consultationType || "Consulta",
        notes: data.notes || `Agendamento confirmado por Amanda (ID: ${data.appointmentId})`,
      },
    };

    console.log(`[SYNC AMANDA] Enviando para E-SAÚDE:`, {
      endpoint,
      payload: {
        ...payload,
        json: {
          ...payload.json,
          token: payload.json.token.substring(0, 10) + "...", // Ocultar token nos logs
        },
      },
    });

    // Fazer requisição para E-SAÚDE
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[SYNC AMANDA] Erro ao sincronizar com E-SAÚDE:`, {
        status: response.status,
        error: responseData,
      });

      // Notificar proprietário sobre o erro
      await notifyOwner({
        title: "❌ Erro ao sincronizar agendamento de Amanda",
        content: `Falha ao sincronizar agendamento de ${data.patientName} (${data.appointmentDate} ${data.appointmentTime}) com E-SAÚDE. Status: ${response.status}. Erro: ${JSON.stringify(responseData)}`,
      });

      throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
    }

    console.log(`[SYNC AMANDA] ✅ Agendamento sincronizado com sucesso:`, {
      appointmentId: data.appointmentId,
      response: responseData,
    });

    // Notificar proprietário sobre o sucesso
    await notifyOwner({
      title: "✅ Agendamento sincronizado de Amanda",
      content: `Agendamento de ${data.patientName} (${data.appointmentDate} ${data.appointmentTime}) foi sincronizado com sucesso para E-SAÚDE.`,
    });

    return responseData;
  } catch (error: any) {
    console.error(`[SYNC AMANDA] Erro crítico ao sincronizar:`, error);

    // Notificar proprietário sobre o erro crítico
    await notifyOwner({
      title: "🔴 Erro crítico ao sincronizar agendamento de Amanda",
      content: `Erro ao processar agendamento de ${data.patientName}: ${error.message}`,
    }).catch((e) => console.error("[SYNC AMANDA] Erro ao notificar proprietário:", e));

    throw error;
  }
}
