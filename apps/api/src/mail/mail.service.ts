import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

// Отправка писем через Gmail. Нужны SMTP_USER и SMTP_PASS (пароль приложения Google) в apps/api/.env.
// Если они не заданы, при разработке письмо не отправляется, а печатается в консоль API.
@Injectable()
export class MailService {
  private readonly logger = new Logger('Почта');
  private transporter?: Transporter;

  async send(message: MailMessage): Promise<void> {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('SMTP_USER и SMTP_PASS не заданы — письмо не отправлено');
        throw new ServiceUnavailableException('Не удалось отправить письмо. Попробуйте позже');
      }
      this.logger.warn(`SMTP не настроен — письмо не отправлено, вот его текст.\nКому: ${message.to}\nТема: ${message.subject}\n${message.text}`);
      return;
    }

    this.transporter ??= createTransport({ service: 'gmail', auth: { user, pass } });
    try {
      await this.transporter.sendMail({ from: process.env.MAIL_FROM || `Luxiwood <${user}>`, ...message });
    } catch (error) {
      this.logger.error(`Письмо на ${message.to} не отправлено: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Не удалось отправить письмо. Попробуйте позже');
    }
  }
}
