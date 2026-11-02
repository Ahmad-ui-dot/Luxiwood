import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';
import { isSwaggerEnabled } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  setupApp(app);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`API: http://localhost:${port}/api`);
  if (isSwaggerEnabled()) {
    console.log(`Swagger: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
