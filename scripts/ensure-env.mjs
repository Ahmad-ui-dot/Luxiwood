// Создаёт apps/api/.env из .env.example, если его ещё нет
import { copyFileSync, existsSync } from 'node:fs';

const envFile = 'apps/api/.env';

if (!existsSync(envFile)) {
  copyFileSync('apps/api/.env.example', envFile);
  console.log('Создан apps/api/.env из .env.example — поменяйте JWT_SECRET и ADMIN_PASSWORD');
}
