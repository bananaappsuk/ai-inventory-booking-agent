import { Resend } from "resend";
import { env } from "./env.js";

export const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;
