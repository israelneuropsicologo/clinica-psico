import { describe, it, expect } from "vitest";

// Copiar as funções de CPF aqui para teste
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

function formatCPF(cpf: string): string {
  const clean = cleanCPF(cpf);
  if (clean.length === 0) return "";
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

function isValidCPF(cpf: string): boolean {
  const clean = cleanCPF(cpf);

  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11))) return false;

  return true;
}

function validateAndFormatCPF(cpf: string): string | null {
  if (!isValidCPF(cpf)) return null;
  return formatCPF(cpf);
}

describe("CPF Utils", () => {
  describe("cleanCPF", () => {
    it("should remove non-numeric characters", () => {
      expect(cleanCPF("123.456.789-10")).toBe("12345678910");
      expect(cleanCPF("123-456-789-10")).toBe("12345678910");
      expect(cleanCPF("12345678910")).toBe("12345678910");
    });

    it("should return empty string for empty input", () => {
      expect(cleanCPF("")).toBe("");
    });
  });

  describe("formatCPF", () => {
    it("should format CPF correctly", () => {
      expect(formatCPF("12345678910")).toBe("123.456.789-10");
      expect(formatCPF("123.456.789-10")).toBe("123.456.789-10");
    });

    it("should handle partial input", () => {
      expect(formatCPF("123")).toBe("123");
      expect(formatCPF("123456")).toBe("123.456");
      expect(formatCPF("123456789")).toBe("123.456.789");
    });

    it("should return empty string for empty input", () => {
      expect(formatCPF("")).toBe("");
    });
  });

  describe("isValidCPF", () => {
    it("should validate correct CPF", () => {
      // Valid CPF: 11144477735
      expect(isValidCPF("11144477735")).toBe(true);
      expect(isValidCPF("111.444.777-35")).toBe(true);
    });

    it("should reject CPF with wrong length", () => {
      expect(isValidCPF("123")).toBe(false);
      expect(isValidCPF("12345678901234")).toBe(false);
    });

    it("should reject CPF with all same digits", () => {
      expect(isValidCPF("11111111111")).toBe(false);
      expect(isValidCPF("00000000000")).toBe(false);
      expect(isValidCPF("99999999999")).toBe(false);
    });

    it("should reject CPF with invalid check digits", () => {
      expect(isValidCPF("11144477736")).toBe(false); // Wrong last digit
      expect(isValidCPF("11144477745")).toBe(false); // Wrong first check digit
    });

    it("should handle formatted CPF", () => {
      expect(isValidCPF("111.444.777-35")).toBe(true);
    });
  });

  describe("validateAndFormatCPF", () => {
    it("should return formatted CPF for valid input", () => {
      expect(validateAndFormatCPF("11144477735")).toBe("111.444.777-35");
      expect(validateAndFormatCPF("111.444.777-35")).toBe("111.444.777-35");
    });

    it("should return null for invalid CPF", () => {
      expect(validateAndFormatCPF("12345678901")).toBe(null);
      expect(validateAndFormatCPF("11111111111")).toBe(null);
      expect(validateAndFormatCPF("111.444.777-36")).toBe(null);
    });
  });
});
