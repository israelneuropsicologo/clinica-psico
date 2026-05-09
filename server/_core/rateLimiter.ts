/**
 * Rate Limiter para proteção de endpoints de webhook
 * Implementa sliding window com limite de requisições por minuto por token
 */

const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 100; // máximo de requisições por minuto

export function checkRateLimit(tokenId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const current = requestCounts.get(tokenId);

  if (!current || now >= current.resetTime) {
    // Nova janela de tempo
    requestCounts.set(tokenId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Limite atingido
    return { allowed: false, remaining: 0 };
  }

  // Incrementar contador
  current.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current.count };
}

export function getRateLimitStatus(tokenId: string): { limit: number; remaining: number; resetTime: number } {
  const now = Date.now();
  const current = requestCounts.get(tokenId);

  if (!current || now >= current.resetTime) {
    return {
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }

  return {
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: RATE_LIMIT_MAX_REQUESTS - current.count,
    resetTime: current.resetTime,
  };
}

// Limpar cache a cada 5 minutos para evitar memory leak
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(requestCounts.entries());
  for (const [tokenId, data] of entries) {
    if (now >= data.resetTime + RATE_LIMIT_WINDOW) {
      requestCounts.delete(tokenId);
    }
  }
}, 5 * 60 * 1000);
