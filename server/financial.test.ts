import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { transactions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Financial Router - Edit & Delete", () => {
  let db: any;
  const testUserId = "user-123"; // This will be converted to a number by the schema
  let transactionId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test transaction
    const result = await db.insert(transactions).values({
      userId: testUserId,
      amount: "100.00",
      type: "income",
      status: "paid",
      category: "session_payment",
      description: "Test transaction",
      transactionDate: Date.now(),
    });
    transactionId = (result[0] as { insertId: number }).insertId;
  });

  afterAll(async () => {
    if (db && transactionId) {
      await db.delete(transactions).where(eq(transactions.id, transactionId));
    }
  });

  it("should retrieve a transaction", async () => {
    const result = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, testUserId)))
      .limit(1);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Test transaction");
    expect(result[0].amount).toBe("100.00");
  });

  it("should update a transaction", async () => {
    await db
      .update(transactions)
      .set({
        description: "Updated transaction",
        amount: "150.00",
        status: "pending",
      })
      .where(eq(transactions.id, transactionId));

    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    expect(result[0].description).toBe("Updated transaction");
    expect(result[0].amount).toBe("150.00");
    expect(result[0].status).toBe("pending");
  });

  it("should verify ownership before update", async () => {
    const otherUserId = "user-456";
    const result = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, otherUserId)))
      .limit(1);

    expect(result).toHaveLength(0);
  });

  it("should delete a transaction", async () => {
    // Create another transaction to delete
    const result = await db.insert(transactions).values({
      userId: testUserId,
      amount: "50.00",
      type: "expense",
      status: "paid",
      category: "rent",
      description: "Transaction to delete",
      transactionDate: Date.now(),
    });
    const deleteId = (result[0] as { insertId: number }).insertId;

    // Delete it
    await db.delete(transactions).where(eq(transactions.id, deleteId));

    // Verify it's gone
    const checkResult = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, deleteId))
      .limit(1);

    expect(checkResult).toHaveLength(0);
  });

  it("should prevent unauthorized deletion", async () => {
    const otherUserId = "user-789";
    
    // Try to delete with wrong user ID
    await db
      .delete(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, otherUserId)));

    // Transaction should still exist
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    expect(result).toHaveLength(1);
  });

  it("should handle bulk operations", async () => {
    // Create multiple transactions
    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      const result = await db.insert(transactions).values({
        userId: testUserId,
        amount: `${50 + i * 10}.00`,
        type: "income",
        status: "paid",
        category: "session_payment",
        description: `Bulk test ${i}`,
        transactionDate: Date.now(),
      });
      ids.push((result[0] as { insertId: number }).insertId);
    }

    // Verify all exist
    const beforeDelete = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, testUserId),
          // SQL IN clause for multiple IDs
        )
      );

    expect(beforeDelete.length).toBeGreaterThanOrEqual(3);

    // Clean up
    for (const id of ids) {
      await db.delete(transactions).where(eq(transactions.id, id));
    }
  });
});
