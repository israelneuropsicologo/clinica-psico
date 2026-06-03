import axios from "axios";

const AMANDA_BASE_URL = "https://psicologo-nloa9w3g.manus.space";
const AMANDA_TOKEN = "site-psicolog-token-64fc5b1393cc3713213c3dcf8c57fcaa";

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
        url: "https://sistemaclinicaapp.manus.space",
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

    console.log("[E-SAÚDE] Handshake enviado para Amanda:", response.data);
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

    console.log("[E-SAÚDE] Amanda está online:", response.data);
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

    console.log("[E-SAÚDE] Mensagem enviada para Amanda:", response.data);
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

    console.log("[E-SAÚDE] Status de sincronização enviado para Amanda:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[E-SAÚDE] Erro ao enviar status:", error.message);
    throw error;
  }
}
