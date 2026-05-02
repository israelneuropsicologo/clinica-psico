import crypto from "crypto";

/**
 * Validador HMAC para webhooks
 * Garante que os dados não foram modificados em trânsito
 */

export function generateHMAC(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyHMAC(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHMAC(payload, secret);
  // Usar timingSafeEqual para evitar timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export function generateWebhookSignature(data: Record<string, unknown>, secret: string): string {
  const payload = JSON.stringify(data);
  return generateHMAC(payload, secret);
}

export function verifyWebhookSignature(
  data: Record<string, unknown>,
  signature: string,
  secret: string
): boolean {
  try {
    const payload = JSON.stringify(data);
    return verifyHMAC(payload, signature, secret);
  } catch (error) {
    console.error("[HMAC] Erro ao verificar assinatura:", error);
    return false;
  }
}
