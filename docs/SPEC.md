# Техническая спецификация — Luxiwood

Версия 1.1 · 30.10.2026 · описывает то, что уже работает в коде. Подробности каждого запроса — в Swagger: http://localhost:4000/api/docs.

## 1. Устройство

| Часть | Что внутри |
| --- | --- |
| `apps/api` | NestJS 11, Prisma 6, PostgreSQL 16 (Docker, порт 5440). Один модуль на тему: контроллеры, сервис, `dto/` |
| `packages/shared` | Без зависимостей от Nest и Prisma: перечисления с русскими названиями, формулы цены, конструктора и доставки, правила этапов заказа, проверка телефона. Используется и сервером, и будущим сайтом |

Общие правила API:

- все пути начинаются с `/api`, загруженные файлы раздаются по `/uploads/...`;
- деньги — целые сомони; цены всегда считает сервер, цены от сайта не принимаются;
- входные данные проверяются DTO (class-validator); лишние поля — ошибка 400;
- любая ошибка — `{ statusCode, message, errors? }`, текст на русском; `errors` — только у ошибки валидации полей;
- списки по страницам: `?page=1&limit=20` (limit до 100) → `{ items, total, page, limit, pages }`.

## 2. Роли и вход

| Роль | Как получить | Что может |
| --- | --- | --- |
| Гость | — | каталог, расчёт цены, конструктор, оформление и отслеживание заказа |
| Покупатель (`CLIENT`) | `POST /api/auth/register` | всё, что гость, + «Мой кабинет» (заказы, отмена на этапе NEW, избранное), отзывы |
| Администратор (`ADMIN`) | создаётся seed из `ADMIN_EMAIL` / `ADMIN_PASSWORD` | всё в `/api/admin/*` |

Регистрация: имя, email, пароль, телефон — по желанию (для связи по заказам). Имя и email уникальны (имя — без учёта регистра).

Пароль: смена со входом (`PATCH /api/auth/password`, нужен текущий пароль); восстановление — 6-значный код на email через Gmail (`forgot-password` → `reset-password`). Код хранится только как хеш, действует 15 минут, одноразовый, после 5 неверных попыток нужен новый. После смены пароля все прежние токены перестают действовать. Без настроенного Gmail (`SMTP_USER`, `SMTP_PASS`) при разработке письмо печатается в консоль API.

Вход: `POST /api/auth/login` с именем или email (телефон для входа не используется) → JWT на 7 дней в заголовке `Authorization: Bearer <токен>`. Пароли — bcrypt. Без токена закрытые пути отдают 401, с чужой ролью — 403. Регистрация и вход — не больше 10 попыток в минуту с одного IP.

## 3. Данные

`User` · `Category` · `Material` (FABRIC — ткань, COLOR — цвет обивки, WOOD — порода дерева, FINISH — покрытие) · `Product` · `ProductMaterial` (роль MAIN / COLOR / WOOD, отметка «по умолчанию») · `ProductSize` · `Order` · `OrderItem` (товар или мебель из конструктора; `snapshot` хранит выбор и расчёт на момент заказа) · `OrderStatusHistory` · `WishlistItem` · `Review` (один на товар от пользователя) · `Setting` (JSON).

Мягкая мебель (`kind = FABRIC`): основной материал — ткань, плюс цвет обивки и дерево ножек. Корпусная (`kind = WOOD`): основной материал — дерево.

## 4. Правила

**Цена товара** (`calcProductPrice`): за штуку = база + доплаты за ткань/дерево, цвет, дерево ножек, размер; итого = × количество (1–99). Варианты проверяются по списку разрешённых у товара; не переданные цвет, дерево и размер берутся по умолчанию.

**Доставка** (`calcDelivery`): `deliveryPrice` (150), бесплатно от суммы товаров `freeDeliveryFrom` (5000). Оба значения меняются в настройках.

**«Встанет ли у вас?»** (`checkFit`): запас = ниша − ширина товара; встанет при запасе от 20 см, 0–19 см — «впритык», меньше 0 — не встанет.

**Конструктор** (`calcConfiguratorPrice`): для дивана, кресла, кровати, шкафа и стола заданы диапазоны размеров, срок и опции (`packages/shared/src/configurator.ts`). Основа = цена типа × объём / объём по умолчанию; доплаты за ткань, цвет, дерево, покрытие растут так же; опции — фиксированная цена и дополнительные дни; итог округляется вверх до 10 сомони. Цены типов и опций — в настройках.

**Заказ**: номер `LX-<год>-<4 цифры>`; не больше 5 заказов в минуту с одного IP; дата доставки — от завтра до +180 дней; оплата при получении (CASH или CARD). Заказ со входом попадает в «Мои заказы».

**Этапы заказа**: NEW (Принят) → FRAME (Каркас) → ASSEMBLY (Сборка) → UPHOLSTERY (Обивка) → DELIVERING (В пути) → DONE (Доставлен). Только вперёд, этап можно пропустить. CANCELLED — из любого незавершённого. Каждая смена пишется в историю. Покупатель отменяет сам только на этапе NEW.

**Удаление**:
- категорию с товарами удалить нельзя (409);
- материал, который используется в товарах или заказах, не удаляется (409) — его отключают через `isActive = false`;
- товар, который есть в заказах, не удаляется, а скрывается;
- удалить можно только отменённый заказ;
- отзыв удаляется, рейтинг товара пересчитывается.

**Файлы**: фото jpg/png/webp до 5 МБ, модели .glb до 30 МБ; другой тип — 400, больше лимита — 413.

## 5. Эндпоинты (61)

| Группа | Методы |
| --- | --- |
| Авторизация (7) | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me`, `PATCH /auth/password`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Категории (1) | `GET /categories` |
| Товары (3) | `GET /products`, `GET /products/filters`, `GET /products/:slug` |
| Материалы (1) | `GET /materials` |
| Отзывы (2) | `GET /products/:id/reviews`, `POST /products/:id/reviews` |
| Расчёт цены (2) | `POST /pricing/quote`, `POST /pricing/fit` |
| Конструктор (2) | `GET /configurator/options`, `POST /configurator/quote` |
| Заказы (2) | `POST /orders`, `GET /orders/track` |
| Мой кабинет (6) | `GET /me/orders`, `GET /me/orders/:number`, `POST /me/orders/:number/cancel`, `GET /me/wishlist`, `POST /me/wishlist/:productId`, `DELETE /me/wishlist/:productId` |
| Настройки (1) | `GET /settings/public` |
| Админ: обзор (1) | `GET /admin/stats` |
| Админ: категории (4) | `GET`, `POST /admin/categories`, `PATCH`, `DELETE /admin/categories/:id` |
| Админ: товары (9) | `GET`, `POST /admin/products`, `GET`, `PATCH`, `DELETE /admin/products/:id`, `PUT /admin/products/:id/materials`, `POST /admin/products/:id/sizes`, `PATCH`, `DELETE /admin/products/:id/sizes/:sizeId` |
| Админ: материалы (4) | `GET`, `POST /admin/materials`, `PATCH`, `DELETE /admin/materials/:id` |
| Админ: заказы (6) | `GET /admin/orders`, `GET`, `PATCH`, `DELETE /admin/orders/:id`, `PATCH /admin/orders/:id/status`, `PATCH /admin/orders/:id/note` |
| Админ: клиенты (2) | `GET /admin/clients`, `GET /admin/clients/:id` |
| Админ: отзывы (3) | `GET /admin/reviews`, `PATCH`, `DELETE /admin/reviews/:id` |
| Админ: настройки (2) | `GET`, `PATCH /admin/settings` |
| Админ: загрузки (3) | `POST /admin/uploads/image`, `POST /admin/uploads/model`, `DELETE /admin/uploads?url=` |

## 6. Проверка

- `pnpm test` — unit-тесты формул в `packages/shared` и e2e-тесты API на отдельной базе `luxiwood_test`. Сценарий: регистрация → вход → каталог → цена → заказ → «Мои заказы» → вход админа → смена этапа → клиент видит этап → отзыв → избранное → CRUD товара, 401/403, лимит заказов.
- `pnpm --filter @luxiwood/api check:swagger` — у каждого эндпоинта есть summary и description, нет пустых схем, enum — именованные, закрытые методы требуют токен.
