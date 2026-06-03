/**
 * Webhook simplificado para Amanda
 * Amanda faz POST aqui e E-SAÚDE responde
 */

import axios from "axios";

const AMANDA_WEBHOOK_URL = "https://psicologo-nloa9w3g.manus.space/api/webhook/esaude";
const AMANDA_TOKEN = "sk_txl9tplq8go4z2awfemx";

export async function notifyAmanda(data: any): Promise<any> {
  try {
    console.log("[E-SAUDE] Enviando para Amanda:", data.type);
    
    const response = await axios.post(
      AMANDA_WEBHOOK_URL,
      {
        timestamp: new Date().toISOString(),
        source: "esaude",
        ...data,
      },
      {
        headers: {
          "Authorization": `Bearer ${AMANDA_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    console.log("[E-SAUDE] ✅ Amanda recebeu:", response.status);
    return response.data;
  } catch (error: any) {
    console.error("[E-SAUDE] ❌ Erro ao enviar para Amanda:", error.message);
    throw error;
  }
}

// Exemplo de uso:
// await notifyAmanda({
//   type: "new_appointment",
//   data: { patientName: "João", time: "14:00" }
// });
