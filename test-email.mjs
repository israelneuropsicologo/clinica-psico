import { sendLoginEmail } from "./server/_core/emailService.ts";

const result = await sendLoginEmail({
  to: "tudoprints@gmail.com",
  name: "Amanda Pereira",
  loginUrl: "https://clinicaapp-p4nfwoum.manus.space/internal-login",
  password: "TempPass123456",
});

console.log("Email enviado:", result);
