import superjson from "superjson";
import { getSessions } from "./server/db";

async function test() {
  const sessions = await getSessions(1);
  
  console.log("\n=== Original Sessions ===");
  console.log(JSON.stringify(sessions.slice(0, 1), null, 2));
  
  console.log("\n=== SuperJSON Serialized ===");
  const serialized = superjson.stringify(sessions.slice(0, 1));
  console.log(serialized);
  
  console.log("\n=== SuperJSON Deserialized ===");
  const deserialized = superjson.parse(serialized);
  console.log(JSON.stringify(deserialized, null, 2));
}

test().catch(console.error);
