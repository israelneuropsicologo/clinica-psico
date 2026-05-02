import { validateApiToken } from "../db-webhooks";

/**
 * Middleware para validar Bearer Token em webhooks
 */
export async function validateWebhookToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7); // Remove "Bearer "
  const apiToken = await validateApiToken(token);

  if (!apiToken) {
    throw new Error("Invalid or expired token");
  }

  return apiToken;
}

/**
 * Valida payload de webhook
 */
export function validateWebhookPayload(payload: any, requiredFields: string[]) {
  for (const field of requiredFields) {
    if (!(field in payload)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  return true;
}

/**
 * Tipos de payloads esperados
 */
export interface PatientWebhookPayload {
  customer_id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  cpf?: string;
  address?: string;
  occupation?: string;
  main_complaint?: string;
  medical_history?: string;
}

export interface AppointmentWebhookPayload {
  customer_id: string;
  appointment_date: string; // ISO 8601
  service_type: string;
  duration_minutes?: number;
  notes?: string;
  payment_status: "pending" | "approved" | "failed";
  transaction_id?: string;
}

export interface PaymentWebhookPayload {
  transaction_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  payment_status: "pending" | "approved" | "failed" | "refunded";
  appointment_id?: string;
  payment_method?: string;
}
