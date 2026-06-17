import { invokeLLM } from "../_core/llm";
import { sendLoginEmail as sendLoginEmailViaGmail } from "../_core/emailService";

interface SendLoginEmailParams {
  email: string;
  name: string;
  password: string;
  loginUrl: string;
}

/**
 * Enviar email com credenciais de login
 */
export async function sendLoginEmail(params: SendLoginEmailParams) {
  try {
    // Enviar email real via Gmail
    const emailSent = await sendLoginEmailViaGmail({
      to: params.email,
      name: params.name,
      loginUrl: params.loginUrl,
      password: params.password,
    });

    if (!emailSent) {
      console.warn(`[Email] Email não foi enviado para ${params.email}`);
      throw new Error("Falha ao enviar email. Verifique as credenciais do Gmail.");
    }

    console.log(`[Email] Email de login enviado com sucesso para ${params.email}`);

    return { success: true, message: "Email enviado com sucesso" };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw error; // Deixar o erro propagar para o tRPC
  }
}


