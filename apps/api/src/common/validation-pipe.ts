import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

// Проверка входных данных: лишние поля запрещены, строки из query приводятся к числам по DTO
export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({ message: 'Проверьте введённые данные', errors: collectMessages(errors) }),
  });
}

// Собирает сообщения со вложенных полей, например items.0.quantity
function collectMessages(errors: ValidationError[], parent = ''): string[] {
  return errors.flatMap((error) => {
    const path = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([rule, message]) =>
      rule === 'whitelistValidation' ? `Поле «${path}» не поддерживается` : message,
    );
    return [...own, ...collectMessages(error.children ?? [], path)];
  });
}
