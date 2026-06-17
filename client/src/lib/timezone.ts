/**
 * Helpers para conversão de timezone
 * Fuso horário padrão: São Paulo (America/Sao_Paulo = UTC-3)
 */

const SAO_PAULO_TIMEZONE = "America/Sao_Paulo";

/**
 * Converte um timestamp UTC para horário local de São Paulo
 * @param utcTimestamp - Timestamp em milissegundos (UTC)
 * @returns Date com horário convertido para São Paulo
 */
export function convertUTCToSaoPaulo(utcTimestamp: number): Date {
  const date = new Date(utcTimestamp);
  
  // Usar Intl.DateTimeFormat para obter o offset correto
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return date;
}

/**
 * Converte um horário local de São Paulo para UTC
 * @param localDate - Data em horário local (São Paulo)
 * @returns Timestamp em milissegundos (UTC)
 */
export function convertSaoPauloToUTC(localDate: Date): number {
  // Obter as partes da data no timezone de São Paulo
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(localDate);
  const partMap = Object.fromEntries(
    parts.map((p) => [p.type, p.value])
  );

  // Criar uma data assumindo que os valores são UTC
  const utcDate = new Date(
    Date.UTC(
      parseInt(partMap.year),
      parseInt(partMap.month) - 1,
      parseInt(partMap.day),
      parseInt(partMap.hour),
      parseInt(partMap.minute),
      parseInt(partMap.second)
    )
  );

  return utcDate.getTime();
}

/**
 * Formata um timestamp UTC para exibição em São Paulo
 * @param utcTimestamp - Timestamp em milissegundos (UTC)
 * @param options - Opções de formatação
 * @returns String formatada
 */
export function formatDateSaoPaulo(
  utcTimestamp: number,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcTimestamp);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: SAO_PAULO_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return new Intl.DateTimeFormat("pt-BR", defaultOptions).format(date);
}

/**
 * Formata apenas a hora em São Paulo
 * @param utcTimestamp - Timestamp em milissegundos (UTC)
 * @returns String com hora (HH:mm)
 */
export function formatTimeSaoPaulo(utcTimestamp: number): string {
  const date = new Date(utcTimestamp);
  
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Formata apenas a data em São Paulo
 * @param utcTimestamp - Timestamp em milissegundos (UTC)
 * @returns String com data (dd/mm/yyyy)
 */
export function formatDateOnlySaoPaulo(utcTimestamp: number): string {
  const date = new Date(utcTimestamp);
  
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Obtém o offset em horas entre UTC e São Paulo
 * @returns Offset em horas (ex: -3 para UTC-3)
 */
export function getSaoPauloUTCOffset(): number {
  const now = new Date();
  
  // Horário UTC
  const utcTime = now.getTime();
  
  // Horário em São Paulo
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const partMap = Object.fromEntries(
    parts.map((p) => [p.type, p.value])
  );

  const spDate = new Date(
    Date.UTC(
      parseInt(partMap.year),
      parseInt(partMap.month) - 1,
      parseInt(partMap.day),
      parseInt(partMap.hour),
      parseInt(partMap.minute),
      parseInt(partMap.second)
    )
  );

  const offset = (utcTime - spDate.getTime()) / (1000 * 60 * 60);
  return offset;
}
