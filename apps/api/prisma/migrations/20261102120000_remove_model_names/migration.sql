-- Убираем фирменные названия моделей: «Скамья для прихожей «Остона»» → «Скамья для прихожей».
-- slug не меняем, чтобы старые ссылки работали. Названия в старых заказах остаются как были
UPDATE "Product" SET "name" = btrim(regexp_replace("name", '\s*«[^»]*»', '', 'g')) WHERE "name" LIKE '%«%';

UPDATE "Product" SET "description" = replace("description", 'в паре с диваном «Ором».', 'в паре с нашими диванами.') WHERE "description" LIKE '%«Ором»%';
UPDATE "Product" SET "description" = replace("description", 'подходит к кроватям «Варзоб» и «Зарафшан».', 'подходит к нашим кроватям.') WHERE "description" LIKE '%«Варзоб»%';
UPDATE "Product" SET "description" = replace("description", 'к обеденному столу «Дастархан» — на', 'к обеденному столу — на') WHERE "description" LIKE '%«Дастархан»%';
