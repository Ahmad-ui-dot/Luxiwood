# Бэкенд (apps/api, NestJS)

## 1. Структура

```
apps/api/
├── prisma/
│   ├── schema.prisma          схема БД — см. database.md
│   ├── migrations/            миграции (init → users/reviews/wishlist → unique name → password reset)
│   └── seed.ts                администратор, тестовый клиент, настройки, каталог, отзывы, демо-заказы
├── scripts/
│   └── check-swagger.ts       проверка полноты Swagger-документации
├── test/                      e2e-тесты на отдельной базе luxiwood_test
├── uploads/                   загруженные фото (images/) и 3D-модели (models/), не в git
├── openapi.json               копия Swagger-схемы для Postman / Insomnia
└── src/
    ├── main.ts                запуск на PORT (4000)
    ├── setup-app.ts           общие настройки: префикс /api, CORS, ValidationPipe, фильтр ошибок, /uploads, Swagger
    ├── app.module.ts          подключение модулей и ThrottlerModule
    ├── swagger.ts             теги (группы) Swagger, описание, включение по SWAGGER_ENABLED
    ├── openapi-export.ts      сохраняет схему в openapi.json
    ├── common/                общий код для всех модулей
    │   ├── all-exceptions.filter.ts   любая ошибка → { statusCode, message, errors? } на русском
    │   ├── validation-pipe.ts         ValidationPipe: whitelist, запрет лишних полей, ошибки по полям
    │   ├── pagination.ts              PaginationQueryDto, pageArgs(), paginate()
    │   ├── parse-id.pipe.ts           ID в пути — целое число, иначе 400
    │   ├── query-transforms.ts        @ToBoolean(), @Trim() для query и body
    │   ├── api-error.decorator.ts     @ApiError(), @ApiValidationError() — описание ошибок в Swagger
    │   └── dto/                       ErrorResponseDto, PaginatedResponseDto
    ├── prisma/                PrismaModule (global) + PrismaService
    ├── auth/                  регистрация, вход, профиль, пароль; AuthGuard, @Auth(), @Roles(), @OptionalAuth(), @CurrentUser()
    ├── mail/                  MailService: письма через Gmail или в консоль
    ├── settings/              SettingsService (global): доставка, контакты, цены конструктора
    ├── categories/            категории: публичный список и админ-CRUD
    ├── products/              каталог, фильтры, страница товара; админ-CRUD товаров, материалов и размеров товара
    ├── materials/             справочник материалов и админ-CRUD
    ├── reviews/               отзывы о товаре и модерация
    ├── pricing/               PricingService: цена товара и «Встанет ли у вас?»
    ├── configurator/          ConfiguratorService: опции и цена мебели из конструктора
    ├── orders/                оформление, отслеживание, «Мои заказы», админка заказов
    ├── wishlist/              избранное
    ├── clients/               админ: покупатели и их заказы
    ├── stats/                 админ: обзор магазина
    └── uploads/               админ: загрузка и удаление фото и .glb
```

## 2. Устройство модуля

Один модуль на тему. Внутри — контроллеры, сервис и папка `dto/`:

| Файл | Что делает | Чего НЕ делает |
|---|---|---|
| `*.controller.ts` | Принимает HTTP-запрос, описывает его в Swagger, проверяет доступ декоратором, вызывает сервис | Не обращается к БД, не содержит бизнес-логики |
| `admin-*.controller.ts` | То же для путей `/api/admin/*`, на классе стоит `@Roles('ADMIN')` | — |
| `*.service.ts` | Вся логика: проверки, транзакции, вызовы других сервисов, приведение ответа к нужному виду | Не знает про HTTP (`req`, `res`) |
| `dto/*.dto.ts` | Классы входных данных с правилами class-validator и русскими сообщениями | Не содержат логики |
| `dto/*.response.dto.ts` | Классы ответов — только для Swagger | В коде как типы не используются |

```ts
// pricing.controller.ts
@ApiTags('Расчёт цены')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('quote')
  @HttpCode(200)
  @ApiOperation({ summary: 'Цена товара с выбранными вариантами', description: 'Доступно всем…' })
  @ApiOkResponse({ description: 'Расчёт', type: QuoteResponseDto })
  @ApiError(404, 'Товар не найден')
  quote(@Body() dto: QuoteDto) {
    return this.pricingService.quote(dto);
  }
}
```

## 2.1. Глобальные модули и общие сервисы

Помечены `@Global()` — их можно внедрять в любой модуль без `imports`:

| Модуль | Что даёт |
|---|---|
| `PrismaModule` | `PrismaService` — весь Prisma Client |
| `SettingsModule` | `SettingsService`: `getAll()`, `getPublic()`, `getDelivery()`, `getConfiguratorPrices()`, `update(dto)` |
| `AuthModule` | `AuthGuard` и `JwtService`, поэтому `@Auth()` и `@Roles()` работают в контроллере любого модуля |

Обычные модули с экспортом для других:

| Сервис | Метод | Кто использует |
|---|---|---|
| `PricingService` | `priceProduct(dto)` — проверяет выбор и считает цену товара | `OrdersModule` |
| `ConfiguratorService` | `priceConfigurator(dto)` — проверяет материалы и считает цену из конструктора | `OrdersModule` |
| `MailService` | `send({ to, subject, text })` | `AuthModule` |

**Сигнатуры этих методов — контракт.** Заказ считается теми же методами, что и расчёт цены на сайте, поэтому их нельзя менять, не проверив `OrdersService`.

## 3. Правила

1. **Валидация через DTO** (class-validator). Глобальный `ValidationPipe`: `whitelist` + `forbidNonWhitelisted` — лишнее поле даёт 400 «Поле «x» не поддерживается»; `transform` — строки из query приводятся к числам по DTO. У каждого правила — своё сообщение на русском.
2. **Доступ задаётся декоратором** на методе или классе:
   - без декоратора — доступно всем;
   - `@Auth()` — нужен вход, любая роль;
   - `@Roles('ADMIN')` или `@Roles('CLIENT')` — нужна роль;
   - `@OptionalAuth()` — вход не обязателен, но если токен передан, пользователь известен (оформление заказа).

   Подробнее — [auth.md](./auth.md).
3. **Цены считает только сервер** через формулы из `@luxiwood/shared` (см. [pricing.md](./pricing.md)). Цены, присланные сайтом, не принимаются: в DTO заказа их просто нет.
4. **Деньги — целые сомони** (`Int`), без дирамов.
5. **Ошибки — стандартные исключения Nest с русским текстом:** `throw new ConflictException('Вы уже оставили отзыв на этот товар')`. `AllExceptionsFilter` приводит любую ошибку к `{ statusCode, message, errors? }`:
   - английские сообщения Nest и Express заменяются общим русским текстом по коду;
   - `PricingError` из `shared` → 400 с её текстом;
   - Prisma `P2002` (повтор уникального значения) → 409, `P2003` (запись используется) → 409, `P2025` (не найдена) → 404;
   - всё остальное → 500 «Внутренняя ошибка сервера», подробности только в логе.
6. **Ответ не раскрывает лишнего.** Пользователь отдаётся без `passwordHash` и `passwordChangedAt` (`toUserResponse`). Отслеживание заказа без верного телефона отвечает 404, не подсказывая, существует ли номер. «Забыли пароль» отвечает одинаково, есть такой email или нет.
7. **Списки — по страницам:** `?page=1&limit=20` (limit до 100) → `{ items, total, page, limit, pages }`. В сервисе: `pageArgs(query)` для Prisma и `paginate(items, total, query)` для ответа. Список и `count` — в одной `$transaction`.
8. **Связанные изменения — в транзакции:** замена материалов товара, пересчёт рейтинга вместе с отзывом, смена этапа заказа вместе с записью в историю, сохранение нескольких настроек.
9. **Удаление бережное:** то, на что ссылаются заказы, не удаляется. Товар из заказов скрывается (`isActive = false`), материал из заказов или товаров — 409 с советом отключить, категория с товарами — 409, удалить можно только отменённый заказ.
10. **Лимиты** (`@UseGuards(ThrottlerGuard)` + `@Throttle`) включаются точечно: регистрация, вход и сброс пароля — 10 в минуту, запрос кода — 5 в минуту, оформление заказа — 5 в минуту с одного IP.
11. **Каждый эндпоинт описан в Swagger:** `@ApiTags` (группа из списка `TAGS` в `swagger.ts`), `@ApiOperation` с `summary` и `description` (кто может вызывать), примеры тела через `@ApiBody`, успешный ответ и ошибки через `@ApiError`. У enum в `@ApiProperty` — `enumName`. Проверка — `check:swagger`.
12. **Новый модуль:** папка в `src/`, модуль в `app.module.ts`, тег в `TAGS` в `swagger.ts`, строка в [api.md](./api.md).

## 4. Основные зависимости

`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/swagger`, `@nestjs/throttler`, `@prisma/client`, `prisma`, `class-validator`, `class-transformer`, `bcrypt`, `multer`, `nodemailer`, `@luxiwood/shared`. Для разработки: `@nestjs/cli`, `jest`, `ts-jest`, `supertest`, `tsx`.

## 5. Команды

```bash
pnpm dev                                        # всё сразу: .env, база, миграции, seed, API
pnpm dev:api                                    # только API (база уже запущена)
pnpm --filter @luxiwood/api db:migrate          # новая миграция после изменения schema.prisma
pnpm --filter @luxiwood/api db:seed             # тестовые данные (повторный запуск безопасен)
pnpm --filter @luxiwood/api db:reset            # пересоздать базу с нуля (все данные удалятся!)
pnpm --filter @luxiwood/api openapi:export      # обновить apps/api/openapi.json
pnpm --filter @luxiwood/api check:swagger       # проверить документацию запущенного API
pnpm build                                      # сборка всех пакетов
pnpm test                                       # unit-тесты shared + e2e-тесты API
pnpm lint                                       # tsc --noEmit во всех пакетах
```

## 6. Тесты

- **Unit** — `packages/shared/src/*.test.ts`: формулы цены, доставки, «Встанет ли у вас?», конструктора, правила этапов заказа, проверка телефона (67 тестов).
- **e2e** — `apps/api/test/shop.e2e-spec.ts` (21 тест). Перед запуском `global-setup.ts` создаёт базу `luxiwood_test`, очищает её, применяет миграции и запускает seed, поэтому каждый запуск начинается с одинаковых данных. `setup-env.ts` подменяет `DATABASE_URL` на тестовую базу и очищает `SMTP_*`, чтобы тесты никогда не отправляли настоящие письма. Приложение в тестах настраивается тем же `setupApp()`, что и в `main.ts`.
- **Сценарий e2e:** регистрация → вход → каталог → цена → заказ → «Мои заказы» → вход админа → смена этапа → клиент видит этап → отзыв → избранное → CRUD товара, 401/403, лимит заказов.

Для e2e нужна запущенная PostgreSQL (`docker compose up -d`).

## 7. Тестовые данные (seed)

`prisma/seed.ts` можно запускать сколько угодно раз — он ничего не дублирует:

| Что | Как создаётся |
|---|---|
| Администратор | из `ADMIN_EMAIL` / `ADMIN_PASSWORD`, имя «Администратор»; если такой email уже есть — пропускается |
| Тестовый клиент | «Мадина», `madina@gmail.com`, `+992 93 000 00 01`, пароль `client12345`; если такой телефон уже есть — пропускается |
| Настройки | значения из `settings.defaults.ts`; уже сохранённые не перезаписываются |
| Каталог | 6 категорий (Диваны, Кресла, Кровати, Шкафы, Обеденные столы, Письменные столы), 17 материалов, 24 товара с материалами и размерами, отзывы и 3 демо-заказа — **только в пустую базу** (если категории уже есть, весь блок пропускается) |

Все цены в seed и цены конструктора — примерные, их нужно заменить реальными ценами мастерской.
