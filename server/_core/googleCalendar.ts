/**
 * Helper para integração com Google Calendar
 * Sincroniza agendamentos da clínica com Google Calendar do psicólogo
 */

import { ENV } from "./env";

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

/**
 * Sincroniza um agendamento com Google Calendar
 * Requer que o usuário tenha autorizado acesso ao Google Calendar
 */
export async function syncAppointmentToGoogleCalendar(
  event: GoogleCalendarEvent,
  accessToken?: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    // Se não houver token, retornar sucesso silencioso (Google Calendar é opcional)
    if (!accessToken) {
      console.log("[Google Calendar] Token não fornecido, sincronização pulada");
      return { success: true };
    }

    // Validar dados do evento
    if (!event.summary || !event.start.dateTime || !event.end.dateTime) {
      return {
        success: false,
        error: "Dados do evento incompletos (summary, start, end são obrigatórios)",
      };
    }

    // Fazer requisição para Google Calendar API
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Google Calendar] Erro ao sincronizar:", error);
      return {
        success: false,
        error: `Google Calendar API error: ${error.error?.message || "Unknown error"}`,
      };
    }

    const createdEvent = await response.json();
    console.log("[Google Calendar] Evento sincronizado com sucesso:", createdEvent.id);

    return {
      success: true,
      eventId: createdEvent.id,
    };
  } catch (error) {
    console.error("[Google Calendar] Erro ao sincronizar agendamento:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Atualiza um evento no Google Calendar
 */
export async function updateGoogleCalendarEvent(
  eventId: string,
  event: GoogleCalendarEvent,
  accessToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!accessToken) {
      return { success: true };
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[Google Calendar] Erro ao atualizar evento:", error);
      return {
        success: false,
        error: `Google Calendar API error: ${error.error?.message || "Unknown error"}`,
      };
    }

    console.log("[Google Calendar] Evento atualizado com sucesso");
    return { success: true };
  } catch (error) {
    console.error("[Google Calendar] Erro ao atualizar evento:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Deleta um evento do Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  eventId: string,
  accessToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!accessToken) {
      return { success: true };
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[Google Calendar] Erro ao deletar evento:", error);
      return {
        success: false,
        error: `Google Calendar API error: ${error.error?.message || "Unknown error"}`,
      };
    }

    console.log("[Google Calendar] Evento deletado com sucesso");
    return { success: true };
  } catch (error) {
    console.error("[Google Calendar] Erro ao deletar evento:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Formata uma data/hora para o formato ISO 8601 esperado pelo Google Calendar
 */
export function formatDateTimeForGoogleCalendar(date: Date, timezone: string = "America/Sao_Paulo"): string {
  return date.toISOString();
}

/**
 * Cria um evento do Google Calendar a partir de dados de agendamento
 */
export function createGoogleCalendarEventFromAppointment(
  appointmentData: {
    patientName: string;
    patientEmail?: string;
    appointmentDate: Date;
    durationMinutes: number;
    serviceType: string;
    notes?: string;
    psychologistEmail?: string;
  }
): GoogleCalendarEvent {
  const startTime = appointmentData.appointmentDate;
  const endTime = new Date(startTime.getTime() + appointmentData.durationMinutes * 60000);

  const attendees: Array<{ email: string; displayName?: string }> = [];

  if (appointmentData.patientEmail) {
    attendees.push({
      email: appointmentData.patientEmail,
      displayName: appointmentData.patientName,
    });
  }

  if (appointmentData.psychologistEmail) {
    attendees.push({
      email: appointmentData.psychologistEmail,
      displayName: "Psicólogo",
    });
  }

  return {
    summary: `${appointmentData.serviceType} - ${appointmentData.patientName}`,
    description: appointmentData.notes || `Sessão de ${appointmentData.serviceType}`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    location: "Online",
    attendees,
  };
}
