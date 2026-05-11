import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { mailConfig } from '../../config/mail.js';

export class MailProvider {
  private static transporter: Transporter = nodemailer.createTransport({
    service: mailConfig.service,
    auth: mailConfig.auth,
  });

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    await MailProvider.transporter.sendMail({
      from: mailConfig.defaults.from,
      to,
      subject,
      html,
    });
  }
}
