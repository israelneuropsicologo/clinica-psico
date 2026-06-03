import nodemailer from "nodemailer";
import { google } from "googleapis";

/**
 * Gerar senha aleatória com apenas números
 */
function generateNumericPassword(length: number = 6): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += Math.floor(Math.random() * 10).toString();
  }
  return password;
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/oauth/callback"
);

/**
 * Enviar email via Gmail usando OAuth2
 * Usa as credenciais do Google configuradas no Manus
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    // Verificar se temos as credenciais necessárias
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("[Email] Credenciais do Google não configuradas");
      return false;
    }

    // Criar transporter com Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "israelneuropsicologo@gmail.com",
        // Usar App Password do Gmail (não a senha da conta)
        // Deve ser configurado em https://myaccount.google.com/apppasswords
        pass: process.env.GMAIL_APP_PASSWORD || "",
      },
    });

    // Enviar email
    const info = await transporter.sendMail({
      from: "israelneuropsicologo@gmail.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || "Email enviado",
    });

    console.log(`[Email] Email enviado com sucesso para ${options.to} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Exportar função para gerar senha
 */
export { generateNumericPassword };

/**
 * Enviar email com link de login para usuário interno
 */
export async function sendLoginEmail(options: {
  to: string;
  name: string;
  loginUrl: string;
  password: string;
}): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { font-size: 12px; color: #999; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bem-vindo ao E-Saúde!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${options.name}</strong>,</p>
            
            <p>Você foi adicionado como usuário interno no sistema E-Saúde | Gestão Clínica.</p>
            
            <h3>Suas Credenciais:</h3>
            <ul>
              <li><strong>Email:</strong> ${options.to}</li>
              <li><strong>Senha Temporária:</strong> ${options.password}</li>
            </ul>
            
            <p>Clique no botão abaixo para fazer login:</p>
            <a href="${options.loginUrl}" class="button">Fazer Login</a>
            
            <p>Ou copie e cole este link no seu navegador:</p>
            <p><code>${options.loginUrl}</code></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p><strong>Importante:</strong></p>
            <ul>
              <li>Esta senha é temporária. Você será solicitado a alterá-la no primeiro login.</li>
              <li>Não compartilhe suas credenciais com ninguém.</li>
              <li>Se você não solicitou este acesso, entre em contato com o administrador.</li>
            </ul>
            
            <div class="footer">
              <p>E-Saúde | Gestão Clínica</p>
              <p>Sistema de Gestão para Psicólogos</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: options.to,
    subject: "Bem-vindo ao E-Saúde - Acesso de Usuário Interno",
    html,
    text: `Olá ${options.name},\n\nVocê foi adicionado como usuário interno.\n\nEmail: ${options.to}\nSenha: ${options.password}\n\nLink de login: ${options.loginUrl}`,
  });
}
