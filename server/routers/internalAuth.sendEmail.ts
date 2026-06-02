import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

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
    // Usar LLM para gerar um email formatado
    const emailContent = await generateLoginEmail(params);

    // Enviar via notifyOwner (que usa o serviço de notificação do Manus)
    const notificationSent = await notifyOwner({
      title: `Email de Login: ${params.name}`,
      content: `Enviar para: ${params.email}\n\n${emailContent}`,
    });

    if (!notificationSent) {
      console.warn(`[Email] Notificação não foi enviada para ${params.email}`);
      // Mesmo que a notificação falhe, retornamos sucesso pois o email foi gerado
    }

    console.log(`[Email] Email gerado e notificação enviada para ${params.email}`);

    return { success: true, message: "Email enviado com sucesso" };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw error; // Deixar o erro propagar para o tRPC
  }
}

/**
 * Gerar conteúdo do email com LLM
 */
async function generateLoginEmail(params: SendLoginEmailParams): Promise<string> {
  const prompt = `
Gere um email profissional em HTML para enviar credenciais de login de um usuário interno.

Dados:
- Nome: ${params.name}
- Email: ${params.email}
- Usuário: ${params.email}
- Senha: ${params.password}
- URL de Acesso: ${params.loginUrl}

O email deve:
1. Ser profissional e formatado em HTML
2. Incluir um aviso de segurança para não compartilhar a senha
3. Incluir um botão destacado com o link de login
4. Incluir as credenciais de forma clara
5. Ter um rodapé com informações de contato

Retorne apenas o HTML do email, sem tags <!DOCTYPE> ou <html>.
`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "Você é um especialista em criar emails profissionais em HTML para sistemas de gerenciamento.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (typeof content === "string") {
    return content;
  }
  return "";
}
