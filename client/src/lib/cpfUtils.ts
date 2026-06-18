/**
 * Funções utilitárias para validação e formatação de CPF
 */

/**
 * Remove caracteres não numéricos do CPF
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Formata CPF para o padrão XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string): string {
  const clean = cleanCPF(cpf);
  if (clean.length === 0) return "";
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

/**
 * Valida CPF usando o algoritmo de dígitos verificadores
 * Retorna true se o CPF é válido, false caso contrário
 */
export function isValidCPF(cpf: string): boolean {
  const clean = cleanCPF(cpf);

  // Verifica se tem 11 dígitos
  if (clean.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(9, 10))) return false;

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(clean.substring(10, 11))) return false;

  return true;
}

/**
 * Valida e formata CPF
 * Retorna o CPF formatado se válido, null se inválido
 */
export function validateAndFormatCPF(cpf: string): string | null {
  if (!isValidCPF(cpf)) return null;
  return formatCPF(cpf);
}
