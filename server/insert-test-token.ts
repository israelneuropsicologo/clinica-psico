// @ts-nocheck
import { getDb } from "./db";
import { apiTokens } from "../drizzle/schema";

async function insertTestToken() {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const testToken = `test_webhook_token_${Date.now()}`;
    
    console.log("Inserting test token...");
    const result = await db.insert(apiTokens).values({
      userId: 1, // Israel Mendes (admin user)
      token: testToken,
      name: "Test Webhook Token",
      description: "Token para testar webhook de agendamentos diretos",
      isActive: 1,
    });

    console.log("✅ Token inserted successfully!");
    console.log("Token:", testToken);
    console.log("Result:", result);

    // Verify the token was inserted
    const verify = await db
      .select()
      .from(apiTokens)
      .where((table) => table.token === testToken)
      .limit(1);

    if (verify.length > 0) {
      console.log("✅ Token verified in database!");
      console.log("Token data:", verify[0]);
    } else {
      console.log("❌ Token not found in database!");
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

insertTestToken();
