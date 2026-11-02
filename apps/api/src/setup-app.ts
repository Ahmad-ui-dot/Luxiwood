import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { createValidationPipe } from './common/validation-pipe';
import { setupSwagger } from './swagger';
import { UPLOADS_DIR } from './uploads/uploads.controller';

// Общие настройки приложения. Используются в main.ts и в e2e-тестах,
// чтобы тесты проверяли то же самое, что работает в бою.
export function setupApp(app: NestExpressApplication) {
  // Префикс задаётся до Swagger, чтобы пути в документации совпадали с реальными
  app.setGlobalPrefix('api');
  // Можно несколько адресов через запятую: "http://localhost:3000,https://luxiwood.vercel.app"
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  // Загруженные фото и 3D-модели: /uploads/images/..., /uploads/models/...
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads' });
  setupSwagger(app);
}
