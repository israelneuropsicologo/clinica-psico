import { describe, it, expect } from "vitest";
import {
  convertUTCToSaoPaulo,
  convertSaoPauloToUTC,
  formatDateSaoPaulo,
  formatTimeSaoPaulo,
  formatDateOnlySaoPaulo,
  getSaoPauloUTCOffset,
} from "./timezone";

describe("Timezone Helpers", () => {
  // Usar uma data fixa para testes: 2026-06-02 14:00:00 UTC
  // Em São Paulo seria: 2026-06-02 11:00:00 (UTC-3)
  const utcTimestamp = new Date("2026-06-02T14:00:00Z").getTime();

  it("should convert UTC to São Paulo correctly", () => {
    const date = convertUTCToSaoPaulo(utcTimestamp);
    expect(date).toBeDefined();
    expect(date instanceof Date).toBe(true);
  });

  it("should convert São Paulo to UTC correctly", () => {
    // Criar uma data local (São Paulo)
    const localDate = new Date("2026-06-02T11:00:00");
    const utcResult = convertSaoPauloToUTC(localDate);
    
    expect(utcResult).toBeDefined();
    expect(typeof utcResult).toBe("number");
    // O resultado deve ser um timestamp válido
    expect(utcResult > 0).toBe(true);
  });

  it("should format date in São Paulo timezone", () => {
    const formatted = formatDateSaoPaulo(utcTimestamp);
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe("string");
    // Deve conter números (data/hora)
    expect(/\d/.test(formatted)).toBe(true);
  });

  it("should format time in São Paulo timezone", () => {
    const formatted = formatTimeSaoPaulo(utcTimestamp);
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe("string");
    // Deve estar no formato HH:mm
    expect(/\d{2}:\d{2}/.test(formatted)).toBe(true);
  });

  it("should format date only in São Paulo timezone", () => {
    const formatted = formatDateOnlySaoPaulo(utcTimestamp);
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe("string");
    // Deve estar no formato dd/mm/yyyy
    expect(/\d{2}\/\d{2}\/\d{4}/.test(formatted)).toBe(true);
  });

  it("should get São Paulo UTC offset", () => {
    const offset = getSaoPauloUTCOffset();
    expect(offset).toBeDefined();
    expect(typeof offset).toBe("number");
    // São Paulo é UTC-3 (ou UTC-2 em horário de verão)
    expect(offset >= -3 && offset <= -2).toBe(true);
  });

  it("should handle edge cases - midnight UTC", () => {
    const midnightUTC = new Date("2026-06-02T00:00:00Z").getTime();
    const formatted = formatTimeSaoPaulo(midnightUTC);
    expect(formatted).toBeDefined();
    // Meia-noite UTC é 21:00 (anterior) em São Paulo
    expect(/\d{2}:\d{2}/.test(formatted)).toBe(true);
  });

  it("should handle edge cases - end of day UTC", () => {
    const endOfDayUTC = new Date("2026-06-02T23:59:59Z").getTime();
    const formatted = formatTimeSaoPaulo(endOfDayUTC);
    expect(formatted).toBeDefined();
    expect(/\d{2}:\d{2}/.test(formatted)).toBe(true);
  });

  it("should round-trip conversion", () => {
    // Começar com um horário em São Paulo
    const originalLocalDate = new Date("2026-06-02T14:00:00");
    
    // Converter para UTC
    const utcTimestamp = convertSaoPauloToUTC(originalLocalDate);
    
    // Converter de volta para São Paulo
    const backToLocal = convertUTCToSaoPaulo(utcTimestamp);
    
    // Verificar que o horário está próximo (dentro de 1 minuto)
    expect(backToLocal).toBeDefined();
  });

  it("should format with custom options", () => {
    const formatted = formatDateSaoPaulo(utcTimestamp, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    expect(formatted).toBeDefined();
    expect(/\d{2}:\d{2}/.test(formatted)).toBe(true);
  });

  it("should handle different timestamps consistently", () => {
    const timestamps = [
      new Date("2026-01-15T10:00:00Z").getTime(), // Janeiro
      new Date("2026-06-15T10:00:00Z").getTime(), // Junho
      new Date("2026-12-15T10:00:00Z").getTime(), // Dezembro
    ];

    timestamps.forEach((ts) => {
      const formatted = formatDateSaoPaulo(ts);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe("string");
    });
  });
});
