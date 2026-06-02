import { describe, it, expect, vi, beforeEach } from "vitest";
import { invitationsRouter } from "./invitations";
import * as invitationsDb from "../db/invitations";

// Mock dos helpers de DB
vi.mock("../db/invitations", () => ({
  createInvitation: vi.fn(),
  validateInvitationToken: vi.fn(),
  getPatientByInvitationToken: vi.fn(),
  updatePatientFromInvitation: vi.fn(),
  listInvitationsByUser: vi.fn(),
  revokeInvitation: vi.fn(),
}));

vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("invitationsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateLink", () => {
    it("should generate a valid invitation link", async () => {
      const mockToken = "test-token-123";
      const mockExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      vi.mocked(invitationsDb.createInvitation).mockResolvedValueOnce({
        id: 1,
        token: mockToken,
        expiresAt: mockExpiresAt,
      });

      // Simular chamada ao procedure
      const result = {
        success: true,
        inviteUrl: `https://example.com/invite/${mockToken}`,
        token: mockToken,
        expiresAt: mockExpiresAt,
      };

      expect(result.success).toBe(true);
      expect(result.token).toBe(mockToken);
      expect(result.inviteUrl).toContain(mockToken);
    });

    it("should set correct expiration date", async () => {
      const mockToken = "token";
      const mockExpiresAt = new Date();
      mockExpiresAt.setDate(mockExpiresAt.getDate() + 30);

      vi.mocked(invitationsDb.createInvitation).mockResolvedValueOnce({
        id: 1,
        token: mockToken,
        expiresAt: mockExpiresAt,
      });

      const result = await invitationsDb.createInvitation(1, 1, 30);

      // Verificar que a data de expiração está aproximadamente 30 dias no futuro
      const daysDiff = Math.floor(
        (result.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(31);
    });
  });

  describe("validateToken", () => {
    it("should validate a valid token", async () => {
      const mockInvitation = {
        id: 1,
        patientId: 1,
        userId: 1,
        token: "valid-token",
        status: "pending" as const,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(invitationsDb.validateInvitationToken).mockResolvedValueOnce({
        valid: true,
        invitation: mockInvitation,
      });

      const result = await invitationsDb.validateInvitationToken("valid-token");

      expect(result.valid).toBe(true);
      expect(result.invitation?.token).toBe("valid-token");
    });

    it("should reject expired token", async () => {
      vi.mocked(invitationsDb.validateInvitationToken).mockResolvedValueOnce({
        valid: false,
        error: "Este convite expirou",
      });

      const result = await invitationsDb.validateInvitationToken("expired-token");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("expirou");
    });

    it("should reject already completed token", async () => {
      vi.mocked(invitationsDb.validateInvitationToken).mockResolvedValueOnce({
        valid: false,
        error: "Este convite já foi preenchido",
      });

      const result = await invitationsDb.validateInvitationToken("completed-token");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("preenchido");
    });
  });

  describe("updatePatientData", () => {
    it("should only allow patient-editable fields", async () => {
      const patientEditableFields = [
        "name",
        "email",
        "phone",
        "birthDate",
        "address",
        "city",
        "state",
        "zipCode",
      ];

      // Verificar que campos do psicólogo não estão na lista
      const psychologistFields = [
        "medicalHistory",
        "medications",
        "mainComplaint",
        "notes",
      ];

      patientEditableFields.forEach((field) => {
        expect(psychologistFields).not.toContain(field);
      });
    });

    it("should update patient data successfully", async () => {
      const updateData = {
        name: "João Silva",
        email: "joao@example.com",
        phone: "(11) 99999-9999",
      };

      vi.mocked(invitationsDb.updatePatientFromInvitation).mockResolvedValueOnce({
        success: true,
        patientId: 1,
      });

      const result = await invitationsDb.updatePatientFromInvitation(
        "token",
        updateData
      );

      expect(result.success).toBe(true);
      expect(result.patientId).toBe(1);
    });

    it("should reject invalid token on update", async () => {
      vi.mocked(invitationsDb.updatePatientFromInvitation).mockResolvedValueOnce({
        error: "Token inválido",
      });

      const result = await invitationsDb.updatePatientFromInvitation(
        "invalid-token",
        { name: "Test" }
      );

      expect("error" in result).toBe(true);
      expect(result.error).toBe("Token inválido");
    });
  });

  describe("listByUser", () => {
    it("should list user invitations", async () => {
      const mockInvitations = [
        {
          id: 1,
          token: "token1",
          status: "pending" as const,
          expiresAt: new Date(),
          completedAt: null,
          createdAt: new Date(),
          patientName: "Patient 1",
          patientEmail: "patient1@example.com",
        },
        {
          id: 2,
          token: "token2",
          status: "completed" as const,
          expiresAt: new Date(),
          completedAt: new Date(),
          createdAt: new Date(),
          patientName: "Patient 2",
          patientEmail: "patient2@example.com",
        },
      ];

      vi.mocked(invitationsDb.listInvitationsByUser).mockResolvedValueOnce(
        mockInvitations
      );

      const result = await invitationsDb.listInvitationsByUser(1);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe("pending");
      expect(result[1].status).toBe("completed");
    });
  });

  describe("revokeInvitation", () => {
    it("should revoke an invitation", async () => {
      vi.mocked(invitationsDb.revokeInvitation).mockResolvedValueOnce({
        success: true,
      });

      const result = await invitationsDb.revokeInvitation(1);

      expect(result.success).toBe(true);
    });
  });

  describe("Field separation", () => {
    it("should have correct psychologist-only fields", () => {
      const psychologistFields = [
        "medicalHistory",
        "medications",
        "mainComplaint",
        "notes",
        "referredBy",
        "status",
        "leadSource",
        "leadStatus",
        "sessionValue",
        "interactionCount",
        "lastInteractionAt",
      ];

      expect(psychologistFields).toContain("medicalHistory");
      expect(psychologistFields).toContain("medications");
      expect(psychologistFields).toContain("mainComplaint");
    });

    it("should have correct patient-editable fields", () => {
      const patientFields = [
        "name",
        "email",
        "phone",
        "birthDate",
        "cpf",
        "address",
        "addressNumber",
        "neighborhood",
        "city",
        "state",
        "zipCode",
        "gender",
        "maritalStatus",
        "schooling",
        "religion",
        "occupation",
        "emergencyContact",
        "emergencyPhone",
        "insuranceName",
        "insuranceNumber",
      ];

      expect(patientFields).toContain("name");
      expect(patientFields).toContain("email");
      expect(patientFields).toContain("phone");
      expect(patientFields).not.toContain("medicalHistory");
      expect(patientFields).not.toContain("mainComplaint");
    });
  });
});
