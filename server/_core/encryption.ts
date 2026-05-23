import crypto from "crypto";

/**
 * Módulo de criptografia para dados sensíveis (CPF, CRP, etc)
 * Usa AES-256-GCM para criptografia autenticada
 */

// Usar a chave de encriptação do ambiente ou gerar uma padrão para testes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-32-chars-long!!";

// Validar que a chave tem o tamanho correto (32 bytes para AES-256)
if (ENCRYPTION_KEY.length < 32) {
  console.warn("[Encryption] ENCRYPTION_KEY é muito curta. Use uma chave de 32 bytes.");
}

// Derivar uma chave de 32 bytes usando SHA-256
const derivedKey = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();

export interface EncryptedData {
  encrypted: string; // Base64 encoded
  iv: string; // Base64 encoded
  authTag: string; // Base64 encoded
}

/**
 * Criptografa um valor sensível usando AES-256-GCM
 */
export function encryptSensitiveData(plaintext: string): EncryptedData {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
      encrypted: Buffer.from(encrypted, "hex").toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
    };
  } catch (error) {
    console.error("[Encryption] Erro ao criptografar dados:", error);
    throw new Error("Falha ao criptografar dados sensíveis");
  }
}

/**
 * Descriptografa um valor sensível
 */
export function decryptSensitiveData(encrypted: EncryptedData): string {
  try {
    const iv = Buffer.from(encrypted.iv, "base64");
    const encryptedBuffer = Buffer.from(encrypted.encrypted, "base64");
    const authTag = Buffer.from(encrypted.authTag, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedBuffer.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[Encryption] Erro ao descriptografar dados:", error);
    throw new Error("Falha ao descriptografar dados sensíveis");
  }
}

/**
 * Criptografa um CPF (remove formatação, criptografa, retorna base64)
 */
export function encryptCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, ""); // Remove formatação
  const encrypted = encryptSensitiveData(cleanCPF);
  return JSON.stringify(encrypted);
}

/**
 * Descriptografa um CPF
 */
export function decryptCPF(encryptedCPF: string): string {
  try {
    const encrypted = JSON.parse(encryptedCPF) as EncryptedData;
    return decryptSensitiveData(encrypted);
  } catch (error) {
    console.error("[Encryption] Erro ao descriptografar CPF:", error);
    throw new Error("Falha ao descriptografar CPF");
  }
}

/**
 * Criptografa um CRP (Conselho Regional de Psicologia)
 */
export function encryptCRP(crp: string): string {
  const encrypted = encryptSensitiveData(crp);
  return JSON.stringify(encrypted);
}

/**
 * Descriptografa um CRP
 */
export function decryptCRP(encryptedCRP: string): string {
  try {
    const encrypted = JSON.parse(encryptedCRP) as EncryptedData;
    return decryptSensitiveData(encrypted);
  } catch (error) {
    console.error("[Encryption] Erro ao descriptografar CRP:", error);
    throw new Error("Falha ao descriptografar CRP");
  }
}

/**
 * Mascara um CPF para exibição (mostra apenas os últimos 2 dígitos)
 */
export function maskCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return "***.***.***-**";
  return `***.***.***-${cleanCPF.slice(-2)}`;
}

/**
 * Mascara um CRP para exibição
 */
export function maskCRP(crp: string): string {
  if (crp.length < 4) return "***";
  return `***/${crp.slice(-2)}`;
}
