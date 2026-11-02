// Перед всеми e2e-тестами: создаёт тестовую базу (если её нет), очищает её,
// применяет миграции и заполняет seed. Так каждый запуск начинается с одинаковых данных.
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { testDatabaseUrl } from './test-db';

export default async function globalSetup() {
  const testUrl = testDatabaseUrl();
  const mainUrl = process.env.DATABASE_URL!;

  const main = new PrismaClient({ datasourceUrl: mainUrl });
  const exists = await main.$queryRaw<unknown[]>`SELECT 1 FROM pg_database WHERE datname = 'luxiwood_test'`;
  if (exists.length === 0) {
    await main.$executeRawUnsafe('CREATE DATABASE luxiwood_test');
  }
  await main.$disconnect();

  const test = new PrismaClient({ datasourceUrl: testUrl });
  await test.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
  await test.$executeRawUnsafe('CREATE SCHEMA public');
  await test.$disconnect();

  const options = { cwd: join(__dirname, '..'), env: { ...process.env, DATABASE_URL: testUrl }, stdio: 'pipe' as const };
  execSync('npx prisma migrate deploy', options);
  execSync('npx tsx prisma/seed.ts', options);
}
