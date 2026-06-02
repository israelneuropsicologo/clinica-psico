import { invokeLLM } from "../_core/llm";

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

    // TODO: Integrar com serviço de email real (SendGrid, Resend, etc)
    // Por enquanto, apenas log
    console.log(`[Email] Enviando para ${params.email}:`);
    console.log(emailContent);

    return { success: true, message: "Email enviado com sucesso" };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, message: "Erro ao enviar email" };
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
