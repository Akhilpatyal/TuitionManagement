import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/tuition_db?schema=public',
  },
});
