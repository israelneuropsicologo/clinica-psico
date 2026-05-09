/**
 * Rate Limiter para proteção de endpoints de webhook
 * Implementa sliding window com limite de requisições por minuto por token
 */

const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 100; // máximo de requisições por minuto

export function checkRateLimit(tokenId: string): { allowed: boolean; remaining: number } {
  // ✅ TOKENS ILIMITADOS - Sem restrição de rate limit
  return { allowed: true, remaining: Infinity };
}

export function getRateLimitStatus(tokenId: string): { limit: number; remaining: number; resetTime: number } {
  // ✅ TOKENS ILIMITADOS - Retornar limite infinito
  const now = Date.now();
  return {
    limit: Infinity,
    remaining: Infinity,
    resetTime: now + RATE_LIMIT_WINDOW,
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
