import axios from "axios";

// Amanda (Chatbot) URLs
const AMANDA_BASE_URL = "https://psicologo-nloa9w3g.manus.space";
const AMANDA_TOKEN = "sk_txl9tplq8go4z2awfemx"; // Token permanente do Amanda

// E-SAÚDE URLs
const ESAUDE_BASE_URL = "https://3000-iq6fiqn3n7badlcgmb0p9-2683e58a.us2.manus.computer";
const ESAUDE_TOKEN = "sk_txl9tplq8go4z2awfemx"; // Token compartilhado para autenticação

export async function sendHandshakeToAmanda() {
  try {
    const message = {
      type: "handshake",
      agent: "esaude-clinica",
      version: "1.0",
      token: AMANDA_TOKEN,
      timestamp: new Date().toISOString(),
      data: {
        capabilities: ["receive_appointments", "validate_data", "auto_fix_errors"],
        url: ESAUDE_BASE_URL,
      },
    };

    const response = await axios.post(
      `${AMANDA_BASE_URL}/api/agents/message`,
      message,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AMANDA_TOKEN}`,
        },
      }
    );

    console.log("[E-SAÚDE] Handshake enviado para Amanda com sucesso", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[E-SAÚDE] Erro ao enviar handshake:", error.message);
    throw error;
  }
}

export async function checkAmandaHealth() {
  try {
    const response = await axios.get(
      `${AMANDA_BASE_URL}/api/agents/health`,
      {
        headers: {
          "Authorization": `Bearer ${AMANDA_TOKEN}`,
        },
      }
    );

    console.log("[E-SAÚDE] Amanda está online:", response.data.status);
    return response.data;
  } catch (error: any) {
    console.error("[E-SAÚDE] Amanda offline:", error.message);
    throw error;
  }
}

export async function sendMessageToAmanda(message: any) {
  try {
    const response = await axios.post(
      `${AMANDA_BASE_URL}/api/agents/message`,
      message,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AMANDA_TOKEN}`,
        },
      }
    );

    console.log("[E-SAÚDE] Mensagem enviada para Amanda:", response.data.id);
    return response.data;
  } catch (error: any) {
    console.error("[E-SAÚDE] Erro ao enviar mensagem:", error.message);
    throw error;
  }
}

export async function sendSyncStatusToAmanda(metrics: any) {
  try {
    const response = await axios.post(
      `${AMANDA_BASE_URL}/api/agents/sync-status`,
      metrics,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AMANDA_TOKEN}`,
        },
      }
    );

    console.log("[E-SAÚDE] Status de sincronização enviado para Amanda:", response.data.timestamp);
    return response.data;
  } catch (error: any) {
    console.error("[E-SAÚDE] Erro ao enviar status:", error.message);
    throw error;
  }
}
