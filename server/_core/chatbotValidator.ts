/**
 * Chatbot Data Validator
 * Validates and processes data received from chatbot webhooks
 * Ensures professional secretary-level data quality
 */

import { z } from "zod";

// Valid appointment times for the clinic
const VALID_APPOINTMENT_TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

// Clinic information
export const CLINIC_INFO = {
  professionalName: "Só O Horário",
  specialties: ["Psicologia Clínica", "Orientação Emocional", "Terapia Individual"],
  workingDays: ["segunda", "terça", "quarta", "quinta", "sexta"],
  workingHours: { start: "09:00", end: "17:00" },
  sessionDuration: 50,
  modalities: ["presencial", "online"],
};

/**
 * Validate that a name is not the professional's name
 */
export function validatePatientName(name: string): boolean {
  const normalizedName = name.toLowerCase().trim();
  const normalizedProfessional = CLINIC_INFO.professionalName.toLowerCase();

  // If the name is exactly the professional's name, it's invalid
  if (normalizedName === normalizedProfessional) {
    return false;
  }

  // If it contains only "horário" or similar, it's likely a mistake
  if (normalizedName.includes("horário") && normalizedName.length < 10) {
    return false;
  }

  return true;
}

/**
 * Validate appointment time format and availability
 */
export function validateAppointmentTime(time: string): boolean {
  // Check format HH:mm
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return false;
  }

  // Check if time is in valid appointment times
  return VALID_APPOINTMENT_TIMES.includes(time);
}

/**
 * Validate appointment date is a working day
 */
export function validateAppointmentDate(date: string): boolean {
  try {
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // 0 = Sunday, 1-5 = Mon-Fri, 6 = Saturday
    // Valid working days are Monday to Friday (1-5)
    if (dayOfWeek < 1 || dayOfWeek > 5) {
      return false;
    }

    // Check if date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (Brazilian format)
 */
export function validatePhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Brazilian phone format: 11 digits (2 digit area code + 9 digit number)
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validate modality (presencial or online)
 */
export function validateModality(modality: string): boolean {
  const normalized = modality.toLowerCase().trim();
  return CLINIC_INFO.modalities.includes(normalized);
}

/**
 * Schema for chatbot appointment webhook
 */
export const chatbotAppointmentSchema = z.object({
  customer_id: z.string().min(1, "ID do cliente é obrigatório"),
  customer_name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .refine(validatePatientName, {
      message: `Nome não pode ser "${CLINIC_INFO.professionalName}" (nome do profissional)`,
    }),
  customer_email: z
    .string()
    .email("Email inválido")
    .refine(validateEmail, "Email deve estar em formato válido"),
  customer_phone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .refine(validatePhone, "Telefone deve estar em formato válido (com DDD)"),
  appointment_date: z
    .string()
    .refine(validateAppointmentDate, "Data deve ser um dia útil no futuro"),
  appointment_time: z
    .string()
    .refine(validateAppointmentTime, `Horário deve ser um de: ${VALID_APPOINTMENT_TIMES.join(", ")}`),
  modality: z
    .string()
    .refine(validateModality, `Modalidade deve ser "presencial" ou "online"`),
  service_type: z.string().optional(),
  notes: z.string().optional(),
  token: z.string().optional(),
  signature: z.string().optional(),
});

/**
 * Schema for chatbot lead webhook
 */
export const chatbotLeadSchema = z.object({
  customer_id: z.string().min(1, "ID do cliente é obrigatório"),
  customer_name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .refine(validatePatientName, {
      message: `Nome não pode ser "${CLINIC_INFO.professionalName}" (nome do profissional)`,
    }),
  customer_email: z
    .string()
    .email("Email inválido")
    .refine(validateEmail, "Email deve estar em formato válido"),
  customer_phone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .refine(validatePhone, "Telefone deve estar em formato válido (com DDD)")
    .optional(),
  message: z.string().optional(),
  token: z.string().optional(),
  signature: z.string().optional(),
});

/**
 * Type exports for use in routers
 */
export type ChatbotAppointmentInput = z.infer<typeof chatbotAppointmentSchema>;
export type ChatbotLeadInput = z.infer<typeof chatbotLeadSchema>;

/**
 * Normalize phone number to standard format
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "");
}

/**
 * Format appointment info for display
 */
export function formatAppointmentInfo(
  name: string,
  date: string,
  time: string,
  modality: string
): string {
  const appointmentDate = new Date(date);
  const formattedDate = appointmentDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `Agendamento de ${name} para ${formattedDate} às ${time} (${modality})`;
}

/**
 * Get suggested alternative times if requested time is unavailable
 */
export function getSuggestedAlternativeTimes(preferredTime: string): string[] {
  const currentIndex = VALID_APPOINTMENT_TIMES.indexOf(preferredTime);

  if (currentIndex === -1) {
    // If time is invalid, return first 3 available times
    return VALID_APPOINTMENT_TIMES.slice(0, 3);
  }

  // Return times around the preferred time
  const alternatives: string[] = [];

  if (currentIndex > 0) alternatives.push(VALID_APPOINTMENT_TIMES[currentIndex - 1]);
  if (currentIndex < VALID_APPOINTMENT_TIMES.length - 1)
    alternatives.push(VALID_APPOINTMENT_TIMES[currentIndex + 1]);
  if (alternatives.length < 2) {
    alternatives.push(...VALID_APPOINTMENT_TIMES.slice(0, 2));
  }

  return [...new Set(alternatives)].slice(0, 3);
}
