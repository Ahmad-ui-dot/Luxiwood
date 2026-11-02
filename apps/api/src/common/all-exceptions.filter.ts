import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PricingError } from '@luxiwood/shared';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

// Сообщения на случай, когда у ошибки нет своего русского текста
const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Неверный запрос',
  401: 'Нужно войти как администратор',
  403: 'Доступ запрещён',
  404: 'Не найдено',
  409: 'Конфликт данных',
  413: 'Файл слишком большой',
  429: 'Слишком много запросов. Попробуйте через минуту',
  500: 'Внутренняя ошибка сервера. Попробуйте позже',
};

// Все ошибки API отдаются в одном формате: { statusCode, message, errors? }
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { statusCode, message, errors } = this.toError(exception);
    response.status(statusCode).json(errors ? { statusCode, message, errors } : { statusCode, message });
  }

  private toError(exception: unknown): { statusCode: number; message: string; errors?: string[] } {
    if (exception instanceof PricingError) {
      return { statusCode: 400, message: exception.message };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();
      const errors = typeof body === 'object' && 'errors' in body ? (body.errors as string[]) : undefined;
      return { statusCode, message: this.russianOrDefault(exception.message, statusCode), errors };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return { statusCode: 409, message: 'Запись с таким значением уже существует' };
      }
      if (exception.code === 'P2003') {
        return { statusCode: 409, message: 'Нельзя удалить: запись используется в других данных' };
      }
      if (exception.code === 'P2025') {
        return { statusCode: 404, message: 'Запись не найдена' };
      }
    }

    this.logger.error(exception);
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: DEFAULT_MESSAGES[500] };
  }

  // Встроенные ошибки Nest и Express приходят на английском — заменяем их общим русским текстом
  private russianOrDefault(message: string, statusCode: number): string {
    if (/[а-яё]/i.test(message)) {
      return message;
    }
    return DEFAULT_MESSAGES[statusCode] ?? DEFAULT_MESSAGES[500];
  }
}
