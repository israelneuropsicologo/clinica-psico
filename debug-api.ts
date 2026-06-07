import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc } from "drizzle-orm";
import { sessions, patients } from "./drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const db = drizzle(DATABASE_URL);
  
  try {
    // Simular a query que getSessions faz
    const result = await db
      .select()
      .from(sessions)
      .leftJoin(patients, eq(sessions.patientId, patients.id))
      .limit(5);
    
    console.log("Raw query result:");
    console.log(JSON.stringify(result, null, 2));
    
    // Simular o mapeamento que getSessions faz
    const mapped = result.map(row => ({
      ...row.sessions,
      patient: row.patients || undefined,
    }));
    
    console.log("\nMapped result:");
    console.log(JSON.stringify(mapped, null, 2));
    
  } catch (error) {
    console.error("Erro:", error);
  }
}

main();
