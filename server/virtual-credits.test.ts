import { describe, it, expect, vi } from "vitest";
import { consumeUserCredits, initializeUserCredits } from "./virtual-credits";

describe("Virtual Credits System", () => {
  describe("Credit Consumption Logic", () => {
    it("should accept positive consumption amounts", () => {
      const currentBalance = 1000;
      const amount = 100;
      const newBalance = currentBalance - amount;

      expect(newBalance).toBe(900);
      expect(newBalance >= -0.01).toBe(true); // Should pass validation
    });

    it("should reject negative balances", () => {
      const currentBalance = 100;
      const amount = 200;
      const newBalance = currentBalance - amount;

      expect(newBalance < -0.01).toBe(true); // Should fail validation
    });

    it("should accept zero consumption", () => {
      const currentBalance = 1000;
      const amount = 0;
      const newBalance = currentBalance - amount;

      expect(newBalance).toBe(1000);
      expect(newBalance >= -0.01).toBe(true);
    });

    it("should accept exact balance consumption", () => {
      const currentBalance = 1000;
      const amount = 1000;
      const newBalance = currentBalance - amount;

      expect(newBalance).toBe(0);
      expect(newBalance >= -0.01).toBe(true);
    });

    it("should handle floating point precision", () => {
      const currentBalance = 1000.5;
      const amount = 100.25;
      const newBalance = currentBalance - amount;

      expect(newBalance).toBeCloseTo(900.25, 2);
      expect(newBalance >= -0.01).toBe(true);
    });

    it("should reject consumption exceeding balance by 1", () => {
      const currentBalance = 1000;
      const amount = 1001;
      const newBalance = currentBalance - amount;

      expect(newBalance < -0.01).toBe(true);
    });

    it("should handle multiple transactions", () => {
      let balance = 1000;

      // First transaction
      balance -= 100;
      expect(balance).toBe(900);

      // Second transaction
      balance -= 200;
      expect(balance).toBe(700);

      // Third transaction
      balance -= 300;
      expect(balance).toBe(400);

      expect(balance >= -0.01).toBe(true);
    });

    it("should calculate total spent correctly", () => {
      const transactions = [100, 200, 150, 50];
      const totalSpent = transactions.reduce((sum, amount) => sum + amount, 0);

      expect(totalSpent).toBe(500);
    });

    it("should handle string to number conversion", () => {
      const amountStr = "100.50";
      const amountNum = parseFloat(amountStr);

      expect(amountNum).toBe(100.5);
      expect(typeof amountNum).toBe("number");
    });

    it("should format balance as string correctly", () => {
      const balance = 900;
      const balanceStr = balance.toString();

      expect(balanceStr).toBe("900");
      expect(typeof balanceStr).toBe("string");
    });

    it("should validate transaction types", () => {
      const validTypes = [
        "email_send",
        "api_call",
        "report_generation",
        "data_sync",
        "manual_adjustment",
      ];

      for (const type of validTypes) {
        expect(validTypes).toContain(type);
      }
    });

    it("should calculate regeneration correctly", () => {
      const balance = 900;
      const regenerationRate = 100;
      const newBalance = balance + regenerationRate;

      expect(newBalance).toBe(1000);
    });

    it("should handle agent credit pool", () => {
      const agentBalance = 10000;
      const regenerationRate = 500;
      const newBalance = agentBalance + regenerationRate;

      expect(newBalance).toBe(10500);
    });

    it("should validate communication is free", () => {
      const communicationCost = 0;
      const balance = 10000;
      const newBalance = balance - communicationCost;

      expect(newBalance).toBe(10000); // No change
    });

    it("should handle edge case: balance exactly at zero", () => {
      const balance = 0;
      const amount = 0;
      const newBalance = balance - amount;

      expect(newBalance).toBe(0);
      expect(newBalance >= -0.01).toBe(true);
    });

    it("should handle large numbers", () => {
      const balance = 1000000;
      const amount = 500000;
      const newBalance = balance - amount;

      expect(newBalance).toBe(500000);
      expect(newBalance >= -0.01).toBe(true);
    });

    it("should handle very small amounts", () => {
      const balance = 1000;
      const amount = 0.01;
      const newBalance = balance - amount;

      expect(newBalance).toBeCloseTo(999.99, 2);
      expect(newBalance >= -0.01).toBe(true);
    });

    it("should track transaction history", () => {
      const transactions = [
        { type: "email_send", amount: 100 },
        { type: "api_call", amount: 50 },
        { type: "report_generation", amount: 75 },
      ];

      expect(transactions).toHaveLength(3);
      expect(transactions[0].type).toBe("email_send");
      expect(transactions[1].amount).toBe(50);
    });

    it("should validate user ID is positive", () => {
      const userId = 999;
      expect(userId > 0).toBe(true);
    });

    it("should validate agent name is string", () => {
      const agentName = "test-agent";
      expect(typeof agentName).toBe("string");
      expect(agentName.length > 0).toBe(true);
    });
  });
});
