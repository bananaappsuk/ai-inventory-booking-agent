import { resend } from "../config/resend.js";
import { env } from "../config/env.js";

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!resend) {
    console.log(`[email:skipped-no-api-key] to=${params.to} subject="${params.subject}"`);
    return false;
  }
  try {
    await resend.emails.send({
      from: env.emailFrom,
      to: params.to,
      subject: params.subject,
      html: params.html
    });
    return true;
  } catch (err) {
    console.error("[email] send failed", err);
    return false;
  }
}
