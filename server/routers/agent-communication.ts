import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  sendMessageToAmanda,
  receiveMessageFromAmanda,
  getMessageQueue,
  getMessageStatus,
  initializeAgentCommunication,
} from "../agent-messaging";

export const agentCommunicationRouter = router({
  // Amanda chama isso para enviar mensagens para E-SAÚDE
  receiveFromAmanda: publicProcedure
    .input(
      z.object({
        type: z.string(),
        data: z.any(),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Validar token (opcional, mas recomendado)
      if (input.token && input.token !== "site-psicolog-token-64fc5b1393cc3713213c3dcf8c57fcaa") {
        throw new Error("Invalid token");
      }

      return receiveMessageFromAmanda(input);
    }),

  // E-SAÚDE chama isso para enviar mensagens para Amanda
  sendToAmanda: publicProcedure
    .input(
      z.object({
        type: z.string(),
        data: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      return sendMessageToAmanda(input);
    }),

  // Ver fila de mensagens
  getQueue: publicProcedure.query(async () => {
    return getMessageQueue();
  }),

  // Ver status de uma mensagem específica
  getMessageStatus: publicProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ input }) => {
      return getMessageStatus(input.messageId);
    }),

  // Inicializar comunicação
  initialize: publicProcedure.mutation(async () => {
    return initializeAgentCommunication();
  }),

  // Verificar status de comunicação
  status: publicProcedure.query(async () => {
    return {
      status: "ready",
      amanda_url: "https://psicologo-nloa9w3g.manus.space",
      esaude_url: "https://sistemaclinicaapp.manus.space",
      queue_size: getMessageQueue().length,
    };
  }),
});
