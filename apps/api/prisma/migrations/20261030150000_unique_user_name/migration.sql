-- Имя пользователя теперь логин для входа, поэтому оно уникально.
-- Если имена повторяются (без учёта регистра), к более позднему добавляется его ID: «Мадина 5».
UPDATE "User" u SET "name" = u."name" || ' ' || u."id"
WHERE EXISTS (SELECT 1 FROM "User" o WHERE lower(o."name") = lower(u."name") AND o."id" < u."id");

CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
