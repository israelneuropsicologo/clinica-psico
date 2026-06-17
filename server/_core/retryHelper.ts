/**
 * Helper para retry automático com backoff exponencial
 * Tenta novamente em caso de falhas de rede ou timeouts
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Não fazer retry na última tentativa
      if (attempt === config.maxAttempts) {
        break;
      }

      // Calcular delay com backoff exponencial
      const jitter = Math.random() * 0.1 * delay; // 10% de jitter
      const nextDelay = Math.min(delay * config.backoffMultiplier + jitter, config.maxDelayMs);

      console.log(
        `[Retry] Tentativa ${attempt}/${config.maxAttempts} falhou. Aguardando ${nextDelay.toFixed(0)}ms antes de retry.`,
        lastError.message
      );

      await new Promise((resolve) => setTimeout(resolve, nextDelay));
      delay = nextDelay;
    }
  }

  throw lastError || new Error("Retry failed after maximum attempts");
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  return retryWithBackoff(fn, { maxAttempts });
}
