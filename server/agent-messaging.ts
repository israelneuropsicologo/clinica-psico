import axios from "axios";

const AMANDA_BASE_URL = "https://psicologo-nloa9w3g.manus.space";
const AMANDA_TOKEN = "sk_txl9tplq8go4z2awfemx"; // Token permanente unificado
const ESAUDE_URL = "https://sistemaclinicaapp.manus.space";

// Fila de mensagens entre agentes
interface AgentMessage {
  id: string;
  from: "esaude" | "amanda";
  to: "esaude" | "amanda";
  type: string;
  timestamp: string;
  data: any;
  status: "pending" | "sent" | "received" | "error";
  error?: string;
}

const messageQueue: Map<string, AgentMessage> = new Map();

export async function sendMessageToAmanda(message: any): Promise<any> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const agentMessage: AgentMessage = {
    id: messageId,
    from: "esaude",
    to: "amanda",
    type: message.type || "message",
    timestamp: new Date().toISOString(),
    data: message,
    status: "pending",
  };

  messageQueue.set(messageId, agentMessage);

  try {
    console.log(`[E-SAUDE] Enviando mensagem para Amanda (${messageId}):`, message);
    
    const response = await axios.post(
      `${AMANDA_BASE_URL}/api/agents/message`,
      {
        ...message,
        esaude_message_id: messageId,
        esaude_url: ESAUDE_URL,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AMANDA_TOKEN}`,
        },
        timeout: 5000,
      }
    );

    agentMessage.status = "sent";
    console.log(`[E-SAUDE] Mensagem enviada com sucesso (${messageId})`);
    return { success: true, messageId, response: response.data };
  } catch (error: any) {
    agentMessage.status = "error";
    agentMessage.error = error.message;
    console.error(`[E-SAUDE] Erro ao enviar mensagem (${messageId}):`, error.message);
    return { success: false, messageId, error: error.message };
  }
}

export async function receiveMessageFromAmanda(message: any): Promise<any> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const agentMessage: AgentMessage = {
    id: messageId,
    from: "amanda",
    to: "esaude",
    type: message.type || "message",
    timestamp: new Date().toISOString(),
    data: message,
    status: "received",
  };

  messageQueue.set(messageId, agentMessage);
  console.log(`[E-SAUDE] Mensagem recebida de Amanda (${messageId}):`, message);

  // Processar mensagem
  if (message.type === "handshake") {
    console.log("[E-SAUDE] Amanda iniciou handshake!");
    return { success: true, messageId, action: "handshake_received" };
  }

  if (message.type === "appointment_sync") {
    console.log("[E-SAUDE] Amanda enviando agendamentos sincronizados");
    return { success: true, messageId, action: "appointments_received" };
  }

  return { success: true, messageId };
}

export function getMessageQueue(): AgentMessage[] {
  return Array.from(messageQueue.values());
}

export function getMessageStatus(messageId: string): AgentMessage | undefined {
  return messageQueue.get(messageId);
}

export function clearOldMessages(olderThanMinutes: number = 60) {
  const now = Date.now();
  const threshold = olderThanMinutes * 60 * 1000;

  messageQueue.forEach((msg, id) => {
    const msgTime = new Date(msg.timestamp).getTime();
    if (now - msgTime > threshold) {
      messageQueue.delete(id);
    }
  });
}

// Inicializar comunicação
export async function initializeAgentCommunication() {
  console.log("[E-SAUDE] Inicializando comunicação com Amanda...");
  
  try {
    // Verificar se Amanda está online
    const healthResponse = await axios.get(
      `${AMANDA_BASE_URL}/api/agents/health`,
      {
        headers: {
          "Authorization": `Bearer ${AMANDA_TOKEN}`,
        },
        timeout: 5000,
      }
    );

    console.log("[E-SAUDE] Amanda está online:", healthResponse.data);

    // Enviar handshake
    const handshakeResponse = await sendMessageToAmanda({
      type: "handshake",
      agent: "esaude-clinica",
      version: "1.0",
      capabilities: ["receive_appointments", "validate_data", "auto_fix_errors"],
      url: ESAUDE_URL,
    });

    console.log("[E-SAUDE] Handshake enviado:", handshakeResponse);
    return { success: true, status: "connected" };
  } catch (error: any) {
    console.warn("[E-SAUDE] Amanda offline ou timeout:", error.message);
    return { success: false, status: "offline", error: error.message };
  }
}
