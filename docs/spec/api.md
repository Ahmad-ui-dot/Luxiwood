# REST API

Базовый путь: `/api`. Формат: JSON. Авторизация: `Authorization: Bearer <токен>` (см. [auth.md](./auth.md)).
Swagger с примерами каждого запроса: `http://localhost:4000/api/docs`, JSON-схема — `/api/docs-json` и `apps/api/openapi.json`.

## 1. Общие соглашения

### Деньги и даты

- Деньги — **целые сомони**. Цены считает только сервер.
- Даты-время — строки ISO (`2026-10-30T12:00:00.000Z`), дата доставки — `ГГГГ-ММ-ДД`.
- Телефон принимается с пробелами (`+992 93 000 00 01`), возвращается без них (`+992930000001`).

### Пагинация (по страницам)

```
GET /api/products?page=2&limit=20
→ { "items": [...], "total": 24, "page": 2, "limit": 20, "pages": 2 }
```

`page` с 1, `limit` по умолчанию 20, максимум 100.

**Почему страницы, а не курсор:** каталог мебели небольшой и меняется редко, а покупателю нужны номера страниц и «найдено 24 товара».

### Ошибки

Любая ошибка — в одном формате, текст на русском:

```json
{ "statusCode": 404, "message": "Товар не найден" }
{ "statusCode": 400, "message": "Проверьте введённые данные", "errors": ["Количество — от 1 до 99", "Поле «price» не поддерживается"] }
```

`errors` есть только у ошибки валидации полей. Сайт показывает `message`, а `errors` — под формой.

| Код | Когда |
|---|---|
| 400 | Неверные данные: валидация, недоступный вариант товара, запрещённая смена этапа |
| 401 | Нет токена, токен недействителен или выдан до смены пароля |
| 403 | Вошёл, но роль не подходит |
| 404 | Не найдено (или скрыто: чужой заказ, неверный телефон при отслеживании) |
| 409 | Конфликт: занято имя или email, удаление используемой записи, отмена не на этапе NEW |
| 413 | Файл больше лимита |
| 429 | Превышен лимит запросов с одного IP |
| 503 | Не удалось отправить письмо |

### Объекты в ответах

Типы — в `packages/shared/src/types.ts`. Основные:

```ts
type ProductListItem = {
  id: number; slug: string; sku: string; name: string;
  basePrice: number; oldPrice: number | null;
  kind: 'FABRIC' | 'WOOD'; room: Room; badge: 'NONE' | 'HIT' | 'NEW';
  widthCm: number; model3dKey: Model3dKey; images: string[];
  productionDays: number; ratingAvg: number; reviewsCount: number;
  category: { id: number; slug: string; name: string; sortOrder: number };
};

type ProductDetails = ProductListItem & {
  description: string; materialsText: string; modelUrl: string | null;
  mainMaterials: Material[]; colorMaterials: Material[]; woodMaterials: Material[];
  sizes: ProductSize[];
  defaults: { mainMaterialId: number | null; colorMaterialId: number | null; woodMaterialId: number | null; sizeId: number | null };
};

type Material = { id: number; type: 'FABRIC' | 'COLOR' | 'WOOD' | 'FINISH'; name: string; hex: string; priceDelta: number; isActive: boolean };
type ProductSize = { id: number; label: string; widthCm: number; heightCm: number; depthCm: number; priceDelta: number; isDefault: boolean };
type PriceLine = { label: string; amount: number };

type Order = {
  id: number; number: string; customerName: string; phone: string; address: string; comment: string | null;
  deliveryDate: string | null; payment: 'CASH' | 'CARD';
  status: OrderStatus; statusLabel: string;
  subtotal: number; deliveryPrice: number; total: number;
  items: { id: number; productId: number | null; title: string; model3dKey: Model3dKey; options: string[]; quantity: number; unitPrice: number }[];
  history: { status: OrderStatus; label: string; changedAt: string }[];
  createdAt: string;
};

type User = { id: number; name: string; email: string | null; phone: string | null; role: 'ADMIN' | 'CLIENT'; defaultAddress: string | null; createdAt: string };
type AuthToken = { accessToken: string; user: User };
```

### Обозначения доступа

🌐 — всем, без входа · 🔓 — вход не обязателен · 🔑 — нужен вход · 👤 — только `CLIENT` · 🛠 — только `ADMIN`

## 2. Эндпоинты (65)

### Авторизация (7)

| Метод | Путь | Доступ | Тело / параметры → ответ |
|---|---|---|---|
| POST | `/auth/register` | 🌐 10/мин | `{ name, email, phone?, password }` → `AuthToken` (201) |
| POST | `/auth/login` | 🌐 10/мин | `{ login, password }` (login — имя или email) → `AuthToken` |
| GET | `/auth/me` | 🔑 | → `User` |
| PATCH | `/auth/me` | 🔑 | `{ name?, email?, phone?, defaultAddress? }` → `User` |
| PATCH | `/auth/password` | 🔑 | `{ currentPassword, newPassword }` → `AuthToken` (новый токен) |
| POST | `/auth/forgot-password` | 🌐 5/мин | `{ email }` → `{ message }` (всегда одинаковый) |
| POST | `/auth/reset-password` | 🌐 10/мин | `{ email, code, newPassword }` → `AuthToken` |

### Каталог (5)

| Метод | Путь | Доступ | Тело / параметры → ответ |
|---|---|---|---|
| GET | `/categories` | 🌐 | → `Category[]` по `sortOrder` |
| GET | `/products` | 🌐 | фильтры ниже → `Paginated<ProductListItem>` |
| GET | `/products/filters` | 🌐 | → данные для фильтров (ниже) |
| GET | `/products/:slug` | 🌐 | → `ProductDetails`; скрытый или несуществующий — 404 «Товар не найден» |
| GET | `/materials` | 🌐 | `?type=FABRIC\|COLOR\|WOOD\|FINISH` → `Material[]` (только активные) |

**Фильтры `GET /products`** (все необязательны, показываются только активные товары):

| Параметр | Значение |
|---|---|
| `category` | slug категории |
| `room` | `LIVING`, `BEDROOM`, `DINING`, `OFFICE`, `KIDS`, `HALLWAY` |
| `type` | `sofa`, `armchair`, `bed`, `wardrobe`, `table`, `chair`, `dresser`, `nightstand`, `shelf`, `pouf`, `bench` (в конструкторе — только первые пять) |
| `search` | часть названия или артикула, без учёта регистра |
| `minPrice`, `maxPrice` | по `basePrice` |
| `maxWidth` | встанет в нишу: `widthCm` ≤ значения |
| `color` | ID материала (цвета или дерева), который разрешён у товара |
| `maxDays` | срок изготовления не больше N дней |
| `badge` | `HIT` или `NEW` |
| `sale` | `true` — только со скидкой (`oldPrice` не null) |
| `sort` | `popular` (по умолчанию: больше отзывов, выше оценка), `price_asc`, `price_desc`, `rating`, `new` |
| `page`, `limit` | страницы |

**Ответ `GET /products/filters`:**
```ts
{
  total: number;                                  // активных товаров
  price: { min, max }; width: { min, max }; days: { min, max };
  colors: { id, name, hex, type: 'COLOR' | 'WOOD', count }[];   // count — сколько товаров в этом цвете
  rooms: { value, label, count }[];
  types: { value, label, count }[];
  saleCount: number;
}
```

### Отзывы (2)

| Метод | Путь | Доступ | Тело / параметры → ответ |
|---|---|---|---|
| GET | `/products/:id/reviews` | 🌐 | → `{ ratingAvg, reviewsCount, items: [{ id, rating, text, authorName, createdAt }] }` — все одобренные, новые сверху, без страниц |
| POST | `/products/:id/reviews` | 👤 | `{ rating: 1–5, text }` → отзыв (201); второй отзыв на тот же товар — 409 |

### Расчёт цены и конструктор (4)

| Метод | Путь | Доступ | Тело / параметры → ответ |
|---|---|---|---|
| POST | `/pricing/quote` | 🌐 | `{ productId, mainMaterialId, colorMaterialId?, woodMaterialId?, sizeId?, quantity }` → `{ unitPrice, quantity, total, breakdown, selection }` |
| POST | `/pricing/fit` | 🌐 | `{ productId, sizeId?, nicheWidthCm }` → `{ fits, freeCm, verdict }` |
| GET | `/configurator/options` | 🌐 | → `{ types: [{ type, label, widthCm, depthCm, heightCm, basePrice, days, usesUpholstery, fabrics, colors, woods, finishes, options: [{ key, label, price, days }] }] }` |
| POST | `/configurator/quote` | 🌐 | `{ type, widthCm, depthCm, heightCm, upholsteryMaterialId?, colorMaterialId?, woodMaterialId, finishMaterialId, options?, quantity? }` → `{ price, quantity, total, days, summary, breakdown }` |

Формулы и проверки — [pricing.md](./pricing.md).

### Заказы (2)

| Метод | Путь | Доступ | Тело / параметры → ответ |
|---|---|---|---|
| POST | `/orders` | 🔓 5/мин | `{ customerName, phone, address, deliveryDate?, payment?, comment?, items: [...] }` → `{ number, status, subtotal, deliveryPrice, total }` (201) |
| GET | `/orders/track` | 🌐 | `?number=LX-2026-0001&phone=+992…` → `{ number, status, statusLabel, deliveryDate, total, items, history, createdAt }` |

Позиции `items` и правила — [orders.md](./orders.md).

### Мой кабинет (6)

| Метод | Путь | Доступ | Тело / параметры → ответ |
|---|---|---|---|
| GET | `/me/orders` | 🔑 | `?page&limit` → `Paginated<Order>`, новые сверху |
| GET | `/me/orders/:number` | 🔑 | → `Order`; чужой — 404 |
| POST | `/me/orders/:number/cancel` | 🔑 | → `Order`; не на этапе NEW — 409 |
| GET | `/me/wishlist` | 🔑 | → `{ addedAt, product: ProductListItem }[]`, скрытые товары не показываются |
| POST | `/me/wishlist/:productId` | 🔑 | → `{ productId, inWishlist: true }`; повтор — не ошибка |
| DELETE | `/me/wishlist/:productId` | 🔑 | → `{ productId, inWishlist: false }`; если не было — тоже 200 |

### Настройки (1)

| Метод | Путь | Доступ | Ответ |
|---|---|---|---|
| GET | `/settings/public` | 🌐 | `{ deliveryPrice, freeDeliveryFrom, workshopPhone, workshopHours }` |

### Админ: обзор (1)

| Метод | Путь | Ответ |
|---|---|---|
| GET | `/admin/stats` | `{ revenue, orders, averageCheck, inWork, newOrders, revenueByMonth, salesByType, topProducts, lastOrders }` — см. [orders.md](./orders.md), п. 7 |

### Админ: категории (4)

| Метод | Путь | Тело / параметры → ответ |
|---|---|---|
| GET | `/admin/categories` | → категории с числом товаров |
| POST | `/admin/categories` | `{ slug, name, sortOrder? }`; повтор slug — 409 |
| PATCH | `/admin/categories/:id` | любые поля из создания |
| DELETE | `/admin/categories/:id` | с товарами — 409 |

### Админ: товары (9)

| Метод | Путь | Тело / параметры → ответ |
|---|---|---|
| GET | `/admin/products` | `?search&categoryId&isActive&room&type&badge&page&limit` → вместе со скрытыми |
| GET | `/admin/products/:id` | → все поля, материалы (и отключённые), размеры |
| POST | `/admin/products` | поля товара + `materials?` + `sizes?` (ниже) |
| PATCH | `/admin/products/:id` | любые поля товара, кроме `materials` и `sizes` |
| DELETE | `/admin/products/:id` | → `{ deleted, hidden, message }`: товар из заказов не удаляется, а скрывается |
| PUT | `/admin/products/:id/materials` | `{ materials: [{ materialId, role, isDefault? }] }` — список заменяется целиком |
| POST | `/admin/products/:id/sizes` | `{ label, widthCm, heightCm, depthCm, priceDelta?, isDefault? }` |
| PATCH | `/admin/products/:id/sizes/:sizeId` | любые поля размера |
| DELETE | `/admin/products/:id/sizes/:sizeId` | в старых заказах размер остаётся в снимке |

**Поля товара:** `slug` (латиница, цифры, дефисы, уникальный), `sku` (уникальный), `name`, `description?`, `categoryId`, `basePrice`, `oldPrice?` (больше `basePrice`, `null` — убрать скидку), `kind`, `room`, `badge?`, `widthCm?` (если нет — из размера по умолчанию; нужен либо он, либо хотя бы один размер), `materialsText?`, `productionDays` (1–120), `model3dKey`, `modelUrl?`, `images?` (до 20), `isActive?`.

Материалы проверяются по роли (см. [database.md](./database.md)): тип должен подходить, без повторов, в каждой роли не больше одного «по умолчанию». У размеров `isDefault: true` снимает отметку с остальных.

### Админ: материалы (4)

| Метод | Путь | Тело / параметры → ответ |
|---|---|---|
| GET | `/admin/materials` | `?type` → вместе с отключёнными |
| POST | `/admin/materials` | `{ type, name, hex: "#RRGGBB", priceDelta?, isActive? }` |
| PATCH | `/admin/materials/:id` | любые поля; сменить тип у привязанного к товарам — 409 |
| DELETE | `/admin/materials/:id` | используемый в товарах или заказах — 409, отключите через `isActive: false` |

### Админ: заказы (6)

| Метод | Путь | Тело / параметры → ответ |
|---|---|---|
| GET | `/admin/orders` | `?status&search&dateFrom&dateTo&page&limit` → список с `itemsCount` |
| GET | `/admin/orders/:id` | → `Order` + `userId`, `adminNote`, позиции с материалами и `snapshot`, `updatedAt` |
| PATCH | `/admin/orders/:id/status` | `{ status }` — по правилам этапов |
| PATCH | `/admin/orders/:id/note` | `{ adminNote }` — пустая строка удаляет |
| PATCH | `/admin/orders/:id` | `{ customerName?, phone?, address?, deliveryDate? }` |
| DELETE | `/admin/orders/:id` | только `CANCELLED` |

### Админ: клиенты (2)

| Метод | Путь | Тело / параметры → ответ |
|---|---|---|
| GET | `/admin/clients` | `?search` (имя, телефон, email) `&page&limit` → `{ id, name, phone, email, ordersCount, totalSpent, lastOrderAt, createdAt }` |
| GET | `/admin/clients/:id` | → то же + `defaultAddress` и список заказов |

### Админ: отзывы (3)

| Метод | Путь | Тело / параметры → ответ |
|---|---|---|
| GET | `/admin/reviews` | `?isApproved&productId&page&limit` → вместе со скрытыми, новые сверху |
| PATCH | `/admin/reviews/:id` | `{ isApproved }` — рейтинг товара пересчитывается |
| DELETE | `/admin/reviews/:id` | рейтинг товара пересчитывается |

### Админ: настройки (2)

| Метод | Путь | Тело / параметры → ответ |
|---|---|---|
| GET | `/admin/settings` | → публичные настройки + `configuratorBasePrices`, `configuratorOptionPrices` |
| PATCH | `/admin/settings` | любые поля; `configuratorBasePrices` — все 5 типов, `configuratorOptionPrices` — только меняемые ключи; цены — целые ≥ 0 |

### Админ: загрузки (3)

| Метод | Путь | Тело / параметры → ответ |
|---|---|---|
| POST | `/admin/uploads/image` | `multipart/form-data`, поле `file` → `{ url, size, originalName }` |
| POST | `/admin/uploads/model` | то же для `.glb` |
| DELETE | `/admin/uploads` | `?url=/uploads/images/…` → `{ url, message }` |

Подробнее — [media.md](./media.md).

### Админ: администраторы (4)

| Метод | Путь | Тело / параметры → ответ |
|---|---|---|
| GET | `/admin/admins` | → `{ id, name, email, createdAt }[]` |
| POST | `/admin/admins` | `{ name, email?, password }`; имя и email уникальны среди всех пользователей — 409 |
| PATCH | `/admin/admins/:id` | любые поля; новый пароль завершает старые входы этого администратора |
| DELETE | `/admin/admins/:id` | себя — 400, последнего администратора — 409 |

## 3. Как добавить эндпоинт

1. Метод в контроллере нужного модуля, логика — в сервисе ([backend.md](./backend.md)).
2. DTO с правилами и русскими сообщениями; ответ описан `*.response.dto.ts`.
3. `@ApiOperation` (summary + кто может вызывать), `@ApiBody` с примером, `@ApiError` на каждую ошибку.
4. Строка в этот файл, счётчик в заголовке раздела 2.
5. `pnpm --filter @luxiwood/api check:swagger` и `openapi:export`.
