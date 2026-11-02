import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { BEARER } from './auth/auth.decorators';

export const SWAGGER_PATH = 'api/docs';

// Группы эндпоинтов в том порядке, в котором они показываются в Swagger.
// Новый модуль — новая строка здесь и @ApiTags с тем же названием на контроллере.
const TAGS = [
  { name: 'Авторизация', description: 'Регистрация покупателя, вход по телефону или email, профиль' },
  { name: 'Категории', description: 'Разделы каталога. Без входа' },
  { name: 'Товары', description: 'Каталог с фильтрами, данные для фильтров, страница товара. Без входа' },
  { name: 'Материалы', description: 'Ткани, цвета обивки, породы дерева и покрытия с цветом и доплатой. Без входа' },
  { name: 'Отзывы', description: 'Отзывы о товаре: читать — всем, писать — покупателю со входом' },
  { name: 'Расчёт цены', description: 'Цена товара с выбранными вариантами и «Встанет ли у вас?». Без входа' },
  { name: 'Конструктор', description: 'Мебель под свои размеры: диван, кресло, кровать, шкаф, стол. Без входа' },
  { name: 'Заказы', description: 'Оформление заказа (гость или со входом) и отслеживание по номеру и телефону' },
  { name: 'Мой кабинет', description: 'Мои заказы и избранное. Нужен вход' },
  { name: 'Настройки', description: 'Доставка и контакты мастерской для сайта. Без входа' },
  { name: 'Админ: обзор', description: 'Выручка, заказы, продажи. Только администратор' },
  { name: 'Админ: категории', description: 'Создание, изменение, удаление категорий. Только администратор' },
  { name: 'Админ: товары', description: 'Товары, их материалы и размеры. Только администратор' },
  { name: 'Админ: материалы', description: 'Ткани, цвета, дерево, покрытия. Только администратор' },
  { name: 'Админ: заказы', description: 'Список, карточка, этапы, заметки, исправления. Только администратор' },
  { name: 'Админ: клиенты', description: 'Зарегистрированные покупатели и их заказы. Только администратор' },
  { name: 'Админ: отзывы', description: 'Модерация отзывов. Только администратор' },
  { name: 'Админ: настройки', description: 'Доставка, контакты, цены конструктора. Только администратор' },
  { name: 'Админ: загрузки', description: 'Фото и 3D-модели товаров. Только администратор' },
  { name: 'Админ: администраторы', description: 'Кто может входить в админку: имя, email, пароль. Только администратор' },
];

const DESCRIPTION = [
  'API интернет-магазина мебели на заказ **Luxiwood** (Душанбе): каталог товаров, материалы, данные для 3D-просмотра.',
  'Все деньги — **целые числа в сомони**, без дирамов. Итоговую цену всегда считает сервер.',
  'Все пути начинаются с `/api`. Любая ошибка приходит в одном формате — `{ statusCode, message, errors? }` (схема ErrorResponseDto), сообщения на русском.',
  'Вход администратора: `POST /api/auth/login` → скопировать `accessToken` → кнопка **Authorize** → вставить токен. ' +
    'Эти методы ещё в разработке: сейчас в API только публичный каталог, вход не нужен.',
  'Эта же документация в JSON: [/api/docs-json](/api/docs-json) — для импорта в Postman или Insomnia.',
].join('\n\n');

// В production документация открыта только при SWAGGER_ENABLED=true
export function isSwaggerEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true';
}

// Глобальный префикс 'api' должен быть задан до вызова, иначе пути в документации будут без /api
export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  const builder = new DocumentBuilder()
    .setTitle('Luxiwood API')
    .setDescription(DESCRIPTION)
    .setVersion(readVersion())
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'accessToken из ответа POST /api/auth/login или /register' },
      BEARER,
    );
  for (const tag of TAGS) {
    builder.addTag(tag.name, tag.description);
  }
  return SwaggerModule.createDocument(app, builder.build());
}

// Страница /api/docs и JSON /api/docs-json
export function setupSwagger(app: INestApplication) {
  if (!isSwaggerEnabled()) {
    return;
  }
  SwaggerModule.setup(SWAGGER_PATH, app, createSwaggerDocument(app), {
    customSiteTitle: 'Luxiwood API — документация',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      operationsSorter: 'method',
    },
  });
}

// Версия API = версия из apps/api/package.json (файл лежит на уровень выше src/ и dist/)
function readVersion(): string {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
  return packageJson.version;
}
