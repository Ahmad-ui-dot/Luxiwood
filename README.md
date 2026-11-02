# Luxiwood

Интернет-магазин мебели на заказ (Душанбе). Монорепозиторий на pnpm:

- `apps/api` — backend на NestJS + Prisma + PostgreSQL ([подробнее](apps/api/README.md))
- `apps/web` — сайт на Next.js + shadcn/ui + Motion + React Three Fiber
- `packages/shared` — общие типы, формулы цены и конструктора, правила этапов заказа, проверка телефона
- `docs/` — [техническое задание](docs/TZ.md), [спецификация](docs/spec/README.md), [план развития](docs/ROADMAP.md)

## Запуск

Нужны Node.js, pnpm и запущенный Docker Desktop.

```bash
pnpm install
pnpm dev
```

`pnpm dev` сам создаёт `apps/api/.env`, поднимает базу (порт 5440), применяет миграции, заполняет тестовые данные и запускает вместе API на http://localhost:4000/api и сайт на http://localhost:3000.

Если база осталась от старой версии и в каталоге не 24 товара, пересоздайте её с новыми тестовыми данными (все данные в базе удалятся):

```bash
pnpm --filter @luxiwood/api db:reset
```

## Документация API

**Swagger: http://localhost:4000/api/docs** — все эндпоинты по группам, с описаниями, примерами запросов и ответов на русском. Любой запрос выполняется прямо со страницы: раскрыть метод → «Try it out» → «Execute».

### Как войти и нажать Authorize

1. Раскройте группу «Авторизация» → `POST /api/auth/login` → «Try it out».
2. В списке Examples выберите:
   - «Администратор» — логин `Администратор` (или `admin@luxiwood.tj`), пароль — `ADMIN_PASSWORD` из `apps/api/.env`;
   - «Тестовый клиент» — логин `Мадина` (или `madina@gmail.com`), пароль `client12345`.

   Входят по **имени или email** и паролю. Имя уникальное, регистр не важен. Телефон для входа не используется — он только для связи по заказам.

   Пароль меняется через `PATCH /api/auth/password`. Если пароль забыт: `POST /api/auth/forgot-password` с email → код из письма → `POST /api/auth/reset-password`.

### Письма через Gmail (восстановление пароля)

В `apps/api/.env` укажите `SMTP_USER` (ваш адрес Gmail) и `SMTP_PASS`. Это не обычный пароль, а **пароль приложения**: Google-аккаунт → Безопасность → включить двухэтапную аутентификацию → «Пароли приложений» → создать (16 букв). После этого перезапустите `pnpm dev`.

Пока они пустые, письмо не отправляется, а его текст с кодом печатается в консоль API — так можно проверять восстановление при разработке.
3. «Execute» → скопируйте `accessToken` из ответа.
4. Нажмите **Authorize** вверху справа, вставьте токен, нажмите Authorize. Токен сохранится и после перезагрузки страницы.

Замочек у метода — нужен вход. Группы «Админ: …» доступны только администратору (иначе 403), «Мой кабинет» — любому вошедшему.

### JSON и Postman / Insomnia

- JSON-схема OpenAPI: http://localhost:4000/api/docs-json. Копия в репозитории — [apps/api/openapi.json](apps/api/openapi.json), обновляется командой `pnpm --filter @luxiwood/api openapi:export`.
- **Postman:** Import → Link → `http://localhost:4000/api/docs-json` (или Import → File → `apps/api/openapi.json`).
- **Insomnia:** Import → From URL → `http://localhost:4000/api/docs-json` (или From File → `apps/api/openapi.json`).

## Проверки

```bash
pnpm build                                  # сборка
pnpm test                                   # unit-тесты формул + e2e-тесты API (нужна запущенная база)
pnpm --filter @luxiwood/api check:swagger   # проверка документации запущенного API
```
