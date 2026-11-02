// Сохраняет документацию API в apps/api/openapi.json без запуска сервера и без базы.
// Запуск: pnpm --filter @luxiwood/api openapi:export
// Лежит в src/, чтобы собираться тем же `nest build` со Swagger-плагином, что и сервер:
// тогда файл совпадает с /api/docs-json.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';
import { createSwaggerDocument } from './swagger';

async function exportOpenApi() {
  // create() не подключается к базе: подключение происходит только при listen()
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error'] });
  setupApp(app);

  const file = join(__dirname, '..', 'openapi.json');
  writeFileSync(file, JSON.stringify(createSwaggerDocument(app), null, 2) + '\n');
  await app.close();
  console.log(`Документация сохранена: ${file}`);
}

exportOpenApi();
