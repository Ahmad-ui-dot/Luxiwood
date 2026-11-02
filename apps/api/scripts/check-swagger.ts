// Проверяет документацию API и выводит список проблем.
// Запуск: pnpm --filter @luxiwood/api check:swagger            — читает /api/docs-json запущенного API
//         pnpm --filter @luxiwood/api check:swagger openapi.json — читает сохранённый файл
// Проверяется:
// - у каждого эндпоинта есть summary, description, тег из списка тегов и успешный ответ (2xx);
// - у каждого параметра есть описание;
// - нет схем {} и object без полей;
// - каждое поле в схемах описано;
// - все enum — отдельные именованные схемы, а не списки значений внутри полей;
// - закрытые эндпоинты (/api/admin/*, /api/me/*, /api/auth/me, /api/auth/password) требуют токен (security jwt) и описывают ответ 401,
//   а админские — ещё и 403.
import 'dotenv/config';
import { readFileSync } from 'node:fs';

type Schema = Record<string, any>;

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const PROTECTED = /^\/api\/(admin|me)(\/|$)|^\/api\/auth\/(me|password)$/;
const problems: string[] = [];

async function loadDocument(): Promise<Schema> {
  const source = process.argv[2] ?? `http://localhost:${process.env.PORT ?? 4000}/api/docs-json`;
  if (!source.startsWith('http')) {
    return JSON.parse(readFileSync(source, 'utf8'));
  }
  try {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`ответ ${response.status}`);
    }
    return (await response.json()) as Schema;
  } catch (error) {
    console.error(`Не удалось получить ${source}: ${(error as Error).message}. Запустите API (pnpm dev) или передайте путь к openapi.json`);
    process.exit(1);
  }
}

// Проверяет схему поля, ответа или параметра. Именованные схемы (components) проверяются отдельно.
function checkSchema(schema: Schema | undefined, where: string) {
  if (!schema || Object.keys(schema).length === 0) {
    problems.push(`${where}: пустая схема {}`);
    return;
  }
  if (schema.$ref) {
    return;
  }
  for (const key of ['allOf', 'oneOf', 'anyOf']) {
    (schema[key] as Schema[] | undefined)?.forEach((part, index) => checkSchema(part, `${where} (${key}[${index}])`));
  }
  if (schema.allOf || schema.oneOf || schema.anyOf) {
    return;
  }
  if (schema.enum) {
    problems.push(`${where}: enum без имени — добавьте enumName в @ApiProperty`);
  }
  if (schema.type === 'array') {
    checkSchema(schema.items, `${where}[]`);
  } else if (schema.type === 'object' || schema.properties) {
    checkObject(schema, where);
  } else if (!schema.type) {
    problems.push(`${where}: не указан тип`);
  }
}

function checkObject(schema: Schema, where: string) {
  const properties = Object.entries((schema.properties ?? {}) as Record<string, Schema>);
  if (properties.length === 0 && !schema.additionalProperties) {
    problems.push(`${where}: object без полей`);
  }
  for (const [name, property] of properties) {
    // У ссылки на другую схему описание бывает только рядом в allOf
    if (!property.description && !property.$ref) {
      problems.push(`${where}.${name}: нет описания`);
    }
    checkSchema(property, `${where}.${name}`);
  }
}

function checkSecurity(operation: Schema, path: string, where: string) {
  if (!PROTECTED.test(path)) {
    return;
  }
  const secured = ((operation.security ?? []) as Schema[]).some((rule) => 'jwt' in rule);
  if (!secured) {
    problems.push(`${where}: закрытый эндпоинт без security jwt — добавьте @Auth() или @Roles('ADMIN')`);
  }
  if (!operation.responses?.['401']) {
    problems.push(`${where}: не описан ответ 401`);
  }
  if (path.startsWith('/api/admin') && !operation.responses?.['403']) {
    problems.push(`${where}: не описан ответ 403`);
  }
}

function checkOperation(operation: Schema, where: string, tagNames: Set<string>) {
  if (!operation.summary) {
    problems.push(`${where}: нет summary`);
  }
  if (!operation.description) {
    problems.push(`${where}: нет description`);
  }
  const tags: string[] = operation.tags ?? [];
  if (tags.length === 0) {
    problems.push(`${where}: нет тега (@ApiTags)`);
  }
  for (const tag of tags.filter((name) => !tagNames.has(name))) {
    problems.push(`${where}: тег «${tag}» не добавлен в список тегов (src/swagger.ts)`);
  }

  for (const parameter of (operation.parameters ?? []) as Schema[]) {
    const name = `${where} параметр ${parameter.name}`;
    if (!parameter.description) {
      problems.push(`${name}: нет описания`);
    }
    checkSchema(parameter.schema, name);
  }

  for (const [type, media] of Object.entries((operation.requestBody?.content ?? {}) as Record<string, Schema>)) {
    checkSchema(media.schema, `${where} тело запроса (${type})`);
  }

  const responses = Object.entries((operation.responses ?? {}) as Record<string, Schema>);
  if (!responses.some(([status]) => status.startsWith('2'))) {
    problems.push(`${where}: нет успешного ответа 2xx`);
  }
  for (const [status, response] of responses) {
    if (!response.description) {
      problems.push(`${where} ответ ${status}: нет описания`);
    }
    for (const media of Object.values((response.content ?? {}) as Record<string, Schema>)) {
      checkSchema(media.schema, `${where} ответ ${status}`);
    }
  }
}

async function main() {
  const document = await loadDocument();
  const tagNames = new Set<string>(((document.tags ?? []) as Schema[]).map((tag) => tag.name));

  let operationCount = 0;
  const countByTag = new Map<string, number>();
  for (const [path, item] of Object.entries((document.paths ?? {}) as Record<string, Schema>)) {
    for (const method of METHODS.filter((name) => item[name])) {
      operationCount += 1;
      for (const tag of (item[method].tags ?? ['без тега']) as string[]) {
        countByTag.set(tag, (countByTag.get(tag) ?? 0) + 1);
      }
      checkOperation(item[method], `${method.toUpperCase()} ${path}`, tagNames);
      checkSecurity(item[method], path, `${method.toUpperCase()} ${path}`);
    }
  }

  for (const [name, schema] of Object.entries((document.components?.schemas ?? {}) as Record<string, Schema>)) {
    // Именованный enum — это и есть то, что нужно
    if (schema.enum) {
      continue;
    }
    checkSchema(schema, `схема ${name}`);
  }

  console.log(`Эндпоинтов: ${operationCount}`);
  for (const [tag, count] of countByTag) {
    console.log(`  ${tag}: ${count}`);
  }
  if (problems.length > 0) {
    console.log(`\nПроблем: ${problems.length}`);
    problems.forEach((problem) => console.log(`- ${problem}`));
    process.exit(1);
  }
  console.log('\nПроблем не найдено');
}

main();
