# База данных

PostgreSQL 16 + Prisma 6. Настоящая схема — `apps/api/prisma/schema.prisma`, здесь — пояснения к ней.

## 1. Общие правила

- ID — автоинкремент `Int` (`1, 2, 3…`). Наружу из чисел видны только ID товаров, материалов и размеров; заказ покупатель видит по номеру `LX-2026-0001`.
- **Деньги — целые сомони** (`Int`), без дирамов: `basePrice`, `priceDelta`, `subtotal`, `total`…
- Телефон хранится без пробелов: `+992930000001`. Email — в нижнем регистре.
- Имена моделей — `PascalCase`, полей — `camelCase`. Таблицы называются так же, как модели (без `@@map`).
- **Счётчики денормализованы:** `Product.ratingAvg` и `Product.reviewsCount` хранятся в строке товара и пересчитываются в той же транзакции, что и изменение отзыва. Так каталог сортируется по популярности без подсчёта на каждый запрос.
- **То, на что ссылаются заказы, не удаляется:** у материала `onDelete: Restrict`, товар из заказов скрывается через `isActive = false`. Подробнее — правила удаления в [backend.md](./backend.md).
- Любое изменение схемы — только через миграцию: `pnpm --filter @luxiwood/api db:migrate` (Prisma спросит название).

## 2. Схема связей (упрощённо)

```
Category ─< Product ─┬─< ProductMaterial >── Material
                     ├─< ProductSize
                     ├─< Review >── User
                     ├─< WishlistItem >── User
                     └─< OrderItem

User ─┬─< Order ─┬─< OrderItem ──> Product? · ProductSize? · Material (main/color/wood/finish)
      │          └─< OrderStatusHistory ──> User? (кто сменил)
      ├─< PasswordReset
      ├─< Review
      └─< WishlistItem

Setting (ключ → JSON) — отдельно, без связей
```

## 3. Перечисления

Значения совпадают с `packages/shared/src/enums.ts`, там же русские названия.

| Enum | Значения | Смысл |
|---|---|---|
| `Role` | `ADMIN`, `CLIENT` | роль пользователя |
| `MaterialType` | `FABRIC`, `COLOR`, `WOOD`, `FINISH` | ткань обивки, цвет обивки, порода дерева, покрытие дерева (масло-воск, лак…) |
| `ProductKind` | `FABRIC`, `WOOD` | мягкая мебель (основной материал — ткань) или корпусная (основной материал — дерево) |
| `MaterialRole` | `MAIN`, `COLOR`, `WOOD` | роль материала у товара: основной, цвет обивки, дерево ножек и каркаса |
| `Model3dKey` | `sofa`, `armchair`, `bed`, `wardrobe`, `table` | встроенная 3D-модель и тип мебели в конструкторе |
| `Room` | `LIVING`, `BEDROOM`, `DINING`, `OFFICE`, `KIDS`, `HALLWAY` | комната для фильтра каталога |
| `Badge` | `NONE`, `HIT`, `NEW` | значок на карточке товара |
| `OrderStatus` | `NEW`, `FRAME`, `ASSEMBLY`, `UPHOLSTERY`, `DELIVERING`, `DONE`, `CANCELLED` | этап заказа: Принят, Каркас, Сборка, Обивка, В пути, Доставлен, Отменён |
| `Payment` | `CASH`, `CARD` | оплата при получении: наличными или картой курьеру |

## 4. Модели

### Пользователи

**`User`**

| Поле | Тип | Пояснение |
|---|---|---|
| `id` | Int | |
| `name` | String, unique | логин для входа; уникальность без учёта регистра дополнительно проверяет `AuthService` |
| `email` | String?, unique | логин для входа и адрес для кода восстановления. У покупателя обязателен (так требует регистрация) |
| `phone` | String?, unique | для связи по заказам, не для входа |
| `passwordHash` | String | bcrypt |
| `passwordChangedAt` | DateTime? | токены, выданные раньше этого момента, не принимаются |
| `role` | Role | по умолчанию `CLIENT` |
| `defaultAddress` | String? | адрес доставки по умолчанию для оформления заказа |
| `createdAt` | DateTime | |

**`PasswordReset`** — код восстановления пароля: `userId`, `codeHash` (bcrypt, сам код не хранится), `attempts` (неудачные попытки, после 5 код не действует), `expiresAt` (+15 минут), `createdAt`. Удаляется вместе с пользователем.

### Каталог

**`Category`** — `slug` (unique), `name`, `sortOrder` (порядок на сайте). Удалить категорию с товарами нельзя (`onDelete: Restrict`).

**`Material`** — `type` (`MaterialType`), `name`, `hex` (`#RRGGBB`, цвет для 3D и кружка выбора), `priceDelta` (доплата, может быть отрицательной), `isActive` (выключенный не виден покупателям и не принимается в расчёте и заказе).

**`Product`**

| Поле | Тип | Пояснение |
|---|---|---|
| `slug`, `sku` | String, unique | адрес страницы (`divan-orom`) и артикул |
| `name`, `description` | String | |
| `categoryId` | Int | |
| `basePrice` | Int | цена в базовой комплектации |
| `oldPrice` | Int? | цена до скидки; `null` — скидки нет. Должна быть больше `basePrice` |
| `kind` | ProductKind | какой материал основной: ткань или дерево |
| `room` | Room | по умолчанию `LIVING` |
| `badge` | Badge | по умолчанию `NONE` |
| `widthCm` | Int | ширина размера по умолчанию — для фильтра «встанет в нишу» |
| `materialsText` | String | состав для страницы товара: «Каркас: массив сосны · Обивка: букле» |
| `productionDays` | Int | срок изготовления, дней |
| `model3dKey` | Model3dKey | встроенная 3D-модель, если нет своей |
| `modelUrl` | String? | своя модель `.glb` (`/uploads/models/...`) |
| `images` | String[] | ссылки на фото (`/uploads/images/...`) |
| `ratingAvg`, `reviewsCount` | Float, Int | по одобренным отзывам, пересчитываются автоматически |
| `isActive` | Boolean | скрытый товар не виден в каталоге и не продаётся |
| `createdAt`, `updatedAt` | DateTime | |

Индексы: `categoryId`, `basePrice`.

**`ProductMaterial`** — какие материалы разрешены у товара. Ключ — `(productId, materialId, role)`. Поле `isDefault` — выбран при открытии страницы (в каждой роли не больше одного). Тип материала должен подходить к роли:

| Роль | Нужный тип материала |
|---|---|
| `MAIN` | `FABRIC` у мягкой мебели, `WOOD` у корпусной |
| `COLOR` | `COLOR` |
| `WOOD` | `WOOD` |

**`ProductSize`** — размеры товара: `label` («210 см»), `widthCm`, `heightCm`, `depthCm`, `priceDelta`, `isDefault` (не больше одного). Если отметки «по умолчанию» нет, по умолчанию берётся первый вариант.

### Заказы

**`Order`**

| Поле | Тип | Пояснение |
|---|---|---|
| `number` | String, unique | `LX-<год>-<4 цифры>` |
| `userId` | Int? | `null` — заказ гостя; при удалении пользователя становится `null` |
| `customerName`, `phone`, `address`, `comment` | String | данные доставки |
| `deliveryDate` | Date? | желаемая дата, от завтра до +180 дней |
| `payment` | Payment | по умолчанию `CASH` |
| `status` | OrderStatus | по умолчанию `NEW` |
| `subtotal`, `deliveryPrice`, `total` | Int | считает сервер |
| `adminNote` | String? | внутренняя заметка, покупатель не видит |
| `createdAt`, `updatedAt` | DateTime | |

Индексы: `status`, `userId`, `createdAt`.

**`OrderItem`** — позиция заказа: товар из каталога (`productId`) **или** мебель из конструктора (`productId = null`, заданы `customWidthCm`/`customDepthCm`/`customHeightCm` и `options`).

| Поле | Пояснение |
|---|---|
| `title` | готовая строка для показа: «Диван трёхместный «Ором» · Букле, Карамель, Дуб · 210 см» |
| `model3dKey` | тип мебели (для статистики продаж и иконки) |
| `mainMaterialId`, `colorMaterialId`, `woodMaterialId`, `finishMaterialId` | выбранные материалы |
| `sizeId` | размер товара из каталога |
| `quantity`, `unitPrice` | количество 1–99 и цена за штуку на момент заказа |
| `snapshot` | JSON: всё, что выбрал покупатель, и расшифровка цены — см. [orders.md](./orders.md) |

**`OrderStatusHistory`** — каждая смена этапа: `status`, `changedAt`, `changedBy` (администратор, клиент при отмене или `null` — гость при оформлении).

### Кабинет покупателя

**`WishlistItem`** — избранное, ключ `(userId, productId)`.

**`Review`** — отзыв: `rating` (1–5), `text`, `isApproved` (по умолчанию `true`; администратор может скрыть). Один отзыв на товар от пользователя: `@@unique([productId, userId])`.

### Настройки

**`Setting`** — `key` → `value` (JSON). Если ключа нет в базе, работает значение по умолчанию из `apps/api/src/settings/settings.defaults.ts`.

| Ключ | Значение по умолчанию | Что это |
|---|---|---|
| `deliveryPrice` | `150` | доставка по Душанбе, сомони |
| `freeDeliveryFrom` | `5000` | от этой суммы товаров доставка бесплатная |
| `workshopPhone` | `"+992 93 000 00 00"` | телефон мастерской |
| `workshopHours` | `"Пн–Сб 9:00–19:00"` | часы работы |
| `configuratorBasePrices` | `{ sofa: 7900, armchair: 3200, bed: 6200, wardrobe: 6900, table: 2700 }` | цена типа мебели в размере по умолчанию |
| `configuratorOptionPrices` | `{ "sofa-mechanism": 1200, … }` | цена опций конструктора по ключу |

## 5. Миграции

| Миграция | Что меняет |
|---|---|
| `20261029103617_init` | первая схема: админ, каталог, материалы, заказы, настройки |
| `20261030120000_users_reviews_wishlist` | `Admin` → `User` с ролями, отзывы, избранное, история этапов; старые статусы переносятся в новые этапы |
| `20261030150000_unique_user_name` | уникальное имя пользователя |
| `20261030170000_password_reset` | `passwordChangedAt` и таблица `PasswordReset` |
