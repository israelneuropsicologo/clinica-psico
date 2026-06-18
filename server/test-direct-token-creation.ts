import { createApiToken, validateApiToken } from "./db-webhooks";

async function test() {
  try {
    console.log("🧪 Starting API token creation test...");
    
    // Create a token
    console.log("Creating token for userId=1...");
    const result = await createApiToken(1, "Test Token Direct", "Direct test");
    console.log("✅ Token created:", result);
    
    // Validate the token immediately
    console.log("Validating token...");
    const validated = await validateApiToken(result.token);
    console.log("✅ Token validation result:", validated);
    
    if (validated) {
      console.log("✅ SUCCESS: Token was saved and retrieved!");
    } else {
      console.log("❌ FAILURE: Token was not found in database!");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
  
  process.exit(0);
}

test();
