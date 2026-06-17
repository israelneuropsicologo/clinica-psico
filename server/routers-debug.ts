import { getSessions } from "./db";

async function testGetSessions() {
  const result = await getSessions(1);
  console.log("Result from getSessions:");
  console.log(JSON.stringify(result.slice(0, 2), null, 2));
  
  // Verificar se o objeto patient está presente
  result.forEach((session, idx) => {
    if (idx < 2) {
      console.log(`Session ${idx}:`, {
        id: session.id,
        patientId: session.patientId,
        hasPatient: !!session.patient,
        patientName: (session.patient as any)?.name,
      });
    }
  });
}

testGetSessions().catch(console.error);
