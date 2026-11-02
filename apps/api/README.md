# @luxiwood/api

Backend Luxiwood: NestJS + Prisma + PostgreSQL. Все пути начинаются с `/api`, все деньги — целые сомони, ошибки — на русском в формате `{ statusCode, message, errors? }`.

Запуск всего проекта — из корня репозитория: `pnpm install`, затем `pnpm dev`.

## Модули

Один модуль на тему: `*.module.ts`, контроллеры, сервис, `dto/`. Публичный и админский контроллеры темы лежат в одной папке.

| Папка | Что делает |
| --- | --- |
| `auth` | регистрация, вход по имени или email, профиль, смена и восстановление пароля; `AuthGuard` и декораторы `@Auth()`, `@Roles('ADMIN')`, `@OptionalAuth()`, `@CurrentUser()` |
| `categories`, `products`, `materials` | каталог для сайта и CRUD для админки |
| `reviews` | отзывы и модерация, пересчёт рейтинга товара |
| `pricing` | цена товара с вариантами и «Встанет ли у вас?» |
| `configurator` | мебель под свои размеры (формулы — в `packages/shared/src/configurator.ts`) |
| `orders` | оформление, отслеживание, «Мои заказы», управление заказами в админке |
| `wishlist` | избранное |
| `clients`, `stats` | клиенты и обзор для админки |
| `settings` | доставка, контакты, цены конструктора |
| `uploads` | загрузка фото и `.glb`, раздача из `uploads/` по адресу `/uploads/...` |

## Команды

Запускаются из корня как `pnpm --filter @luxiwood/api <команда>`:

| Команда | Что делает |
| --- | --- |
| `start:dev` | API с перезапуском при изменениях |
| `build` | сборка в `dist/` |
| `test` | e2e-тесты (supertest) на отдельной базе `luxiwood_test` — рабочая база не трогается |
| `db:migrate` | применить миграции / создать новую по `prisma/schema.prisma` |
| `db:seed` | тестовые данные (каталог — только в пустую базу) |
| `db:reset` | удалить все данные, применить миграции и заполнить seed заново |
| `openapi:export` | сохранить документацию в `openapi.json` без запуска сервера |
| `check:swagger` | проверить документацию запущенного API; `check:swagger openapi.json` — проверить файл |

Вход — по имени или email и паролю (`POST /api/auth/login`, поле `login`). Тестовые входы после seed: администратор `Администратор` (или `ADMIN_EMAIL`) / `ADMIN_PASSWORD` из `.env`, клиент `Мадина` (или `madina@gmail.com`) / `client12345`.

## Переменные окружения

Все переменные с комментариями — в [.env.example](.env.example). `SWAGGER_ENABLED` нужна только в production (`NODE_ENV=production`): там документация выключена, пока не стоит `SWAGGER_ENABLED=true`.

## Документация API

- **Swagger UI:** http://localhost:4000/api/docs. Вход: `POST /api/auth/login` (примеры «Администратор» и «Тестовый клиент») → скопировать `accessToken` → **Authorize** → вставить токен (схема `jwt`).
- **JSON:** http://localhost:4000/api/docs-json, копия — [openapi.json](openapi.json) (подходит для генерации типов на фронтенде).
- **Postman / Insomnia:** Import → Link / From URL → `http://localhost:4000/api/docs-json`, или импорт файла `openapi.json`.

`check:swagger` падает, если есть эндпоинт без summary или description, ответ с пустой схемой, enum без имени, поле без описания или закрытый эндпоинт (`/api/admin/*`, `/api/me/*`, `/api/auth/me`) без security `jwt` и ответа 401 (у админских — ещё 403).

Как описывать новый эндпоинт:

1. На контроллере — `@ApiTags('…')`; новый тег добавить в `TAGS` в [src/swagger.ts](src/swagger.ts).
2. Закрытый метод — `@Auth()` или `@Roles('ADMIN')`: они же добавляют замочек и ответы 401/403 в Swagger.
3. На методе — `@ApiOperation({ summary, description })`, `@ApiBody` с примерами, ответ с `type: SomeResponseDto`, ошибки — `@ApiError(404, 'Текст')`.
4. Списки по страницам — `PaginationQueryDto` в запросе и `@ApiPaginatedResponse(Dto, '…')` в ответе.
5. У enum в `@ApiProperty` обязательно `enumName`.
6. Проверить: `openapi:export`, затем `check:swagger openapi.json`.
