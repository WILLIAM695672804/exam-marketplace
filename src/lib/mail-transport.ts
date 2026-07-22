import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE, // true pour port 465 (SSL/TLS)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});
