import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import { sessions, patients } from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const db = drizzle(DATABASE_URL);
  
  try {
    // Contar sessões com patientId = 0
    const zeroCount = await db
      .select({ count: sql`COUNT(*)` })
      .from(sessions)
      .where(eq(sessions.patientId, 0));
    
    console.log("Sessões com patientId = 0:", zeroCount[0]?.count || 0);
    
    // Atualizar as sessões
    const result = await db
      .update(sessions)
      .set({ patientId: 1 })
      .where(eq(sessions.patientId, 0));
    
    console.log("Atualização concluída");
    
    // Verificar o resultado
    const updated = await db
      .select()
      .from(sessions)
      .limit(3);
    
    console.log("Primeiras 3 sessões após atualização:");
    console.log(JSON.stringify(updated, null, 2));
    
  } catch (error) {
    console.error("Erro:", error);
  }
}

main();
