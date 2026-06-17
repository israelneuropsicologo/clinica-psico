/**
 * Data Sanitizer - Converte dados recebidos dos webhooks para o formato esperado
 * Resolve problemas de incompatibilidade de tipos entre o site público e o backend
 */

export type IsPaidValue = "pending" | "paid" | "waived";

/**
 * Converte qualquer valor para o enum correto de isPaid
 * @param value - Pode ser boolean, string, null, undefined
 * @returns "paid" | "pending"
 */
export function normalizeIsPaid(value: any): IsPaidValue {
  // Se for null ou undefined, retorna "pending"
  if (value === null || value === undefined) {
    return "pending";
  }

  // Se for string, valida e retorna
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "paid" || normalized === "approved" || normalized === "true") {
      return "paid";
    }
    if (normalized === "waived" || normalized === "free") {
      return "waived";
    }
    return "pending";
  }

  // Se for boolean
  if (typeof value === "boolean") {
    return value ? "paid" : "pending";
  }

  // Se for número
  if (typeof value === "number") {
    return value === 1 || value > 0 ? "paid" : "pending";
  }

  // Fallback
  return "pending";
}

/**
 * Normaliza dados de sessão recebidos de webhooks
 */
export function normalizeSessionData(data: any) {
  return {
    ...data,
    isPaid: normalizeIsPaid(data.isPaid),
    sessionValue: data.sessionValue ? parseFloat(String(data.sessionValue)) : null,
  };
}
