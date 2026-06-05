// src/repositories/test-utils.ts
// Helper para testes: cria uma DB SQLite in-memory (better-sqlite3) com Drizzle.
// Aplica migrações e devolve o cliente pronto para uso nos testes.
// Não usa expo-sqlite (que requer runtime nativo) — usa better-sqlite3 puro.

import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/db/schema';

export type TestDB = BetterSQLite3Database<typeof schema>;

export function createTestDB(): { db: TestDB; close: () => void } {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './src/db/migrations' });
  return {
    db,
    close: () => sqlite.close(),
  };
}
