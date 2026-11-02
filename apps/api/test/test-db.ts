import { config } from 'dotenv';
import { join } from 'node:path';

// e2e-тесты работают с отдельной базой luxiwood_test в том же PostgreSQL, рабочая база не трогается
export function testDatabaseUrl(): string {
  config({ path: join(__dirname, '..', '.env') });
  const url = new URL(process.env.DATABASE_URL ?? '');
  url.pathname = '/luxiwood_test';
  return url.toString();
}
