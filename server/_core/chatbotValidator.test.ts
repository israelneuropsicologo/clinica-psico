import { describe, it, expect } from "vitest";
import {
  validatePatientName,
  validateAppointmentTime,
  validateAppointmentDate,
  validateEmail,
  validatePhone,
  validateModality,
  normalizePhone,
  getSuggestedAlternativeTimes,
  CLINIC_INFO,
} from "./chatbotValidator";

describe("Chatbot Validator", () => {
  describe("validatePatientName", () => {
    it("should reject professional name", () => {
      expect(validatePatientName("Só O Horário")).toBe(false);
      expect(validatePatientName("SÓ O HORÁRIO")).toBe(false);
      expect(validatePatientName("só o horário")).toBe(false);
    });

    it("should reject names containing only 'horário'", () => {
      expect(validatePatientName("horário")).toBe(false);
      expect(validatePatientName("Horário")).toBe(false);
    });

    it("should accept valid patient names", () => {
      expect(validatePatientName("João Silva")).toBe(true);
      expect(validatePatientName("Maria Santos")).toBe(true);
      expect(validatePatientName("Pedro Oliveira")).toBe(true);
    });
  });

  describe("validateAppointmentTime", () => {
    it("should accept valid appointment times", () => {
      expect(validateAppointmentTime("09:00")).toBe(true);
      expect(validateAppointmentTime("14:00")).toBe(true);
      expect(validateAppointmentTime("17:00")).toBe(true);
    });

    it("should reject invalid times", () => {
      expect(validateAppointmentTime("08:00")).toBe(false); // Before working hours
      expect(validateAppointmentTime("18:00")).toBe(false); // After working hours
      expect(validateAppointmentTime("12:30")).toBe(false); // Not in valid times
      expect(validateAppointmentTime("9:00")).toBe(false); // Wrong format
      expect(validateAppointmentTime("25:00")).toBe(false); // Invalid hour
    });
  });

  describe("validateAppointmentDate", () => {
    it("should accept future weekdays", () => {
      const futureMonday = new Date();
      futureMonday.setDate(futureMonday.getDate() + 7);
      // Adjust to Monday if needed
      while (futureMonday.getDay() !== 1) {
        futureMonday.setDate(futureMonday.getDate() + 1);
      }

      expect(validateAppointmentDate(futureMonday.toISOString().split("T")[0])).toBe(true);
    });

    it("should reject weekends", () => {
      const nextSaturday = new Date();
      nextSaturday.setDate(nextSaturday.getDate() + ((6 - nextSaturday.getDay() + 7) % 7 || 7));

      expect(validateAppointmentDate(nextSaturday.toISOString().split("T")[0])).toBe(false);
    });

    it("should reject past dates", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(validateAppointmentDate(yesterday.toISOString().split("T")[0])).toBe(false);
    });

    it("should reject invalid date format", () => {
      expect(validateAppointmentDate("invalid")).toBe(false);
      expect(validateAppointmentDate("2026-13-01")).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("should accept valid emails", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("john.doe@company.co.br")).toBe(true);
      expect(validateEmail("test+tag@domain.org")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user @example.com")).toBe(false);
    });
  });

  describe("validatePhone", () => {
    it("should accept valid Brazilian phone numbers", () => {
      expect(validatePhone("11987654321")).toBe(true); // 11 digits
      expect(validatePhone("1133334444")).toBe(true); // 10 digits
      expect(validatePhone("(11) 98765-4321")).toBe(true); // Formatted
      expect(validatePhone("(11) 3333-4444")).toBe(true); // Formatted
    });

    it("should reject invalid phone numbers", () => {
      expect(validatePhone("123")).toBe(false); // Too short
      expect(validatePhone("123456789012345")).toBe(false); // Too long
      expect(validatePhone("abc")).toBe(false); // Non-numeric
    });
  });

  describe("validateModality", () => {
    it("should accept valid modalities", () => {
      expect(validateModality("presencial")).toBe(true);
      expect(validateModality("online")).toBe(true);
      expect(validateModality("PRESENCIAL")).toBe(true);
      expect(validateModality("ONLINE")).toBe(true);
      expect(validateModality(" presencial ")).toBe(true);
    });

    it("should reject invalid modalities", () => {
      expect(validateModality("telefone")).toBe(false);
      expect(validateModality("video")).toBe(false);
      expect(validateModality("")).toBe(false);
    });
  });

  describe("normalizePhone", () => {
    it("should remove formatting characters", () => {
      expect(normalizePhone("(11) 98765-4321")).toBe("11987654321");
      expect(normalizePhone("11 98765-4321")).toBe("11987654321");
      expect(normalizePhone("11987654321")).toBe("11987654321");
    });
  });

  describe("getSuggestedAlternativeTimes", () => {
    it("should return alternative times near preferred time", () => {
      const alternatives = getSuggestedAlternativeTimes("14:00");
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.length).toBeLessThanOrEqual(3);
    });

    it("should return first times if preferred time is invalid", () => {
      const alternatives = getSuggestedAlternativeTimes("12:30");
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives[0]).toBe("09:00");
    });

    it("should not have duplicates", () => {
      const alternatives = getSuggestedAlternativeTimes("09:00");
      expect(new Set(alternatives).size).toBe(alternatives.length);
    });
  });

  describe("CLINIC_INFO", () => {
    it("should have correct professional name", () => {
      expect(CLINIC_INFO.professionalName).toBe("Só O Horário");
    });

    it("should have valid working hours", () => {
      expect(CLINIC_INFO.workingHours.start).toBe("09:00");
      expect(CLINIC_INFO.workingHours.end).toBe("17:00");
    });

    it("should have valid modalities", () => {
      expect(CLINIC_INFO.modalities).toContain("presencial");
      expect(CLINIC_INFO.modalities).toContain("online");
    });
  });
});
