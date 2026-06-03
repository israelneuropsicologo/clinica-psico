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
  // Gerar URL padrão personalizada se não fornecida
  const defaultLoginUrl = `https://sistemaclinicaapp.manus.space/internal-login?email=${encodeURIComponent(options.to)}&token=${Buffer.from(options.password).toString('base64')}`;
  const finalLoginUrl = options.loginUrl || defaultLoginUrl;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .email-wrapper { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1e40af 0%, #0369a1 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.95; font-weight: 500; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 16px; color: #1f2937; margin-bottom: 20px; }
          .greeting strong { color: #0369a1; }
          .description { font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 30px; }
          .credentials-section { margin: 30px 0; }
          .credentials-title { font-size: 14px; font-weight: 700; color: #0369a1; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
          .credentials { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0369a1; padding: 20px; border-radius: 6px; font-family: 'Courier New', monospace; }
          .credentials-item { margin: 12px 0; display: flex; align-items: center; }
          .credentials-icon { margin-right: 12px; font-size: 18px; }
          .credentials-label { font-weight: 700; color: #0369a1; min-width: 80px; }
          .credentials-value { color: #1f2937; word-break: break-all; }
          .cta-section { text-align: center; margin: 35px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 12px rgba(3, 105, 161, 0.3); }
          .button:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(3, 105, 161, 0.4); }
          .link-section { margin: 20px 0; }
          .link-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
          .link-box { background: #f3f4f6; padding: 12px 15px; border-radius: 4px; word-break: break-all; font-family: 'Courier New', monospace; font-size: 12px; color: #1f2937; border: 1px solid #e5e7eb; }
          .warning-section { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 6px; }
          .warning-title { font-weight: 700; color: #d97706; margin-bottom: 10px; font-size: 14px; }
          .warning-list { margin: 10px 0; padding-left: 20px; }
          .warning-list li { margin: 6px 0; font-size: 13px; color: #92400e; line-height: 1.5; }
          .footer { background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-brand { font-weight: 700; font-size: 16px; color: #0369a1; margin: 0; }
          .footer-subtitle { font-size: 13px; color: #6b7280; margin: 8px 0 0 0; }
          .footer-note { font-size: 11px; color: #9ca3af; margin: 15px 0 0 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="header">
              <h1>🏥 E-Saúde</h1>
              <p>Sistema de Gestão Clínica</p>
            </div>
            
            <div class="content">
              <p class="greeting">Olá <strong>${options.name}</strong>,</p>
              
              <p class="description">
                Você foi adicionado como usuário interno no sistema <strong>E-Saúde | Gestão Clínica</strong> do psicólogo <strong>Israel Mendes</strong>.
              </p>
              
              <div class="credentials-section">
                <div class="credentials-title">Suas Credenciais de Acesso</div>
                <div class="credentials">
                  <div class="credentials-item">
                    <span class="credentials-icon">📧</span>
                    <span class="credentials-label">Email:</span>
                    <span class="credentials-value">${options.to}</span>
                  </div>
                  <div class="credentials-item">
                    <span class="credentials-icon">🔐</span>
                    <span class="credentials-label">Senha:</span>
                    <span class="credentials-value">${options.password}</span>
                  </div>
                </div>
              </div>
              
              <div class="cta-section">
                <a href="${finalLoginUrl}" class="button">Acessar Sistema E-Saúde</a>
              </div>
              
              <div class="link-section">
                <div class="link-label">Ou acesse diretamente pelo link:</div>
                <div class="link-box">${finalLoginUrl}</div>
              </div>
              
              <div class="warning-section">
                <div class="warning-title">⚠️ Informações Importantes</div>
                <ul class="warning-list">
                  <li>Esta senha é temporária. Você será solicitado a alterá-la no primeiro login.</li>
                  <li>Não compartilhe suas credenciais com ninguém.</li>
                  <li>Guarde este email em local seguro para referência futura.</li>
                  <li>Se você não solicitou este acesso, entre em contato com o administrador.</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-brand">🏥 E-Saúde | Gestão Clínica</p>
              <p class="footer-subtitle">Psicólogo: Israel Mendes</p>
              <p class="footer-note">Sistema desenvolvido com segurança e privacidade em primeiro lugar</p>
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
    text: `Olá ${options.name},\n\nVocê foi adicionado como usuário interno no sistema E-Saúde | Gestão Clínica do psicólogo Israel Mendes.\n\nEmail: ${options.to}\nSenha: ${options.password}\n\nLink de login: ${finalLoginUrl}`,
  });
}
