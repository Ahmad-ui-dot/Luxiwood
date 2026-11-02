// Каждый тестовый файл подключается к тестовой базе, а не к рабочей
import { testDatabaseUrl } from './test-db';

process.env.DATABASE_URL = testDatabaseUrl();

// Тесты никогда не отправляют настоящие письма, даже если в .env настроен Gmail
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
