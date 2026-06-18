import { describe, it, expect } from "vitest";
import {
  encryptSensitiveData,
  decryptSensitiveData,
  encryptCPF,
  decryptCPF,
  encryptCRP,
  decryptCRP,
  maskCPF,
  maskCRP,
} from "./_core/encryption";

describe("encryption module", () => {
  it("should encrypt and decrypt sensitive data", () => {
    const plaintext = "This is sensitive data";
    const encrypted = encryptSensitiveData(plaintext);

    expect(encrypted).toHaveProperty("encrypted");
    expect(encrypted).toHaveProperty("iv");
    expect(encrypted).toHaveProperty("authTag");

    const decrypted = decryptSensitiveData(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should encrypt and decrypt CPF", () => {
    const cpf = "123.456.789-09";
    const encrypted = encryptCPF(cpf);

    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe("string");

    const decrypted = decryptCPF(encrypted);
    expect(decrypted).toBe("12345678909"); // CPF sem formatação
  });

  it("should encrypt and decrypt CRP", () => {
    const crp = "05/85230";
    const encrypted = encryptCRP(crp);

    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe("string");

    const decrypted = decryptCRP(encrypted);
    expect(decrypted).toBe(crp);
  });

  it("should mask CPF correctly", () => {
    const cpf = "123.456.789-09";
    const masked = maskCPF(cpf);

    expect(masked).toBe("***.***.***-09");
  });

  it("should mask CRP correctly", () => {
    const crp = "05/85230";
    const masked = maskCRP(crp);

    expect(masked).toBe("***/30");
  });

  it("should handle invalid CPF format", () => {
    const invalidCPF = "invalid";
    const masked = maskCPF(invalidCPF);

    expect(masked).toBe("***.***.***-**");
  });

  it("should produce different ciphertexts for same plaintext (due to random IV)", () => {
    const plaintext = "Same data";
    const encrypted1 = encryptSensitiveData(plaintext);
    const encrypted2 = encryptSensitiveData(plaintext);

    // IVs should be different
    expect(encrypted1.iv).not.toBe(encrypted2.iv);

    // But both should decrypt to the same value
    const decrypted1 = decryptSensitiveData(encrypted1);
    const decrypted2 = decryptSensitiveData(encrypted2);

    expect(decrypted1).toBe(plaintext);
    expect(decrypted2).toBe(plaintext);
  });

  it("should throw error on invalid encrypted data", () => {
    const invalidEncrypted = {
      encrypted: "invalid",
      iv: "invalid",
      authTag: "invalid",
    };

    expect(() => decryptSensitiveData(invalidEncrypted)).toThrow();
  });
});
