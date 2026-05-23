import { createCaller } from "./server/_core/trpc.ts";
import { createContext } from "./server/_core/context.ts";

// Simular um agendamento do ChatBot
async function testChatbotAppointment() {
  try {
    console.log("🧪 Testando webhook de agendamento do ChatBot...\n");

    // Criar contexto com usuário autenticado
    const ctx = await createContext({
      req: { headers: {} },
      res: {},
    });

    // Se não houver usuário, usar um ID de teste
    const userId = ctx.user?.id || 1;
    console.log(`✅ Contexto criado com userId: ${userId}\n`);

    // Criar caller do router
    const caller = createCaller(ctx);

    // Dados do agendamento do ChatBot
    const appointmentData = {
      customer_id: "chatbot-amanda-001",
      customer_name: "Amanda Silva",
      customer_email: "amanda@example.com",
      customer_phone: "(21) 98765-4321",
      appointment_date: "2026-05-05",
      appointment_time: "14:00",
      service_type: "consultation",
      notes: "Primeira consulta - referência do ChatBot",
      session_type: "presencial",
    };

    console.log("📋 Dados do agendamento:");
    console.log(JSON.stringify(appointmentData, null, 2));
    console.log("\n");

    // Chamar o webhook
    const result = await caller.webhooks.syncChatbotAppointment(appointmentData);

    console.log("✅ Agendamento sincronizado com sucesso!");
    console.log(JSON.stringify(result, null, 2));
    console.log("\n");

    // Verificar se a sessão foi criada
    const sessions = await caller.sessions.list({});
    console.log("📅 Sessões no sistema:");
    sessions.forEach((session) => {
      console.log(`  - ID: ${session.id}, Paciente: ${session.patientId}, Status: ${session.status}`);
    });

  } catch (error) {
    console.error("❌ Erro ao testar webhook:");
    console.error(error);
  }
}

testChatbotAppointment();
