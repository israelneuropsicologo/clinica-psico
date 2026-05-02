import { getSessions } from "./server/db";

async function test() {
  const sessions = await getSessions(1);
  
  console.log("\n=== Test Results ===");
  console.log(`Total sessions: ${sessions.length}`);
  
  sessions.slice(0, 3).forEach((session, idx) => {
    console.log(`\nSession ${idx}:`);
    console.log(`  ID: ${session.id}`);
    console.log(`  PatientID: ${session.patientId}`);
    console.log(`  Has patient field: ${'patient' in session}`);
    console.log(`  Patient object: ${JSON.stringify(session.patient)}`);
    console.log(`  Patient name: ${(session as any).patient?.name}`);
  });
}

test().catch(console.error);
