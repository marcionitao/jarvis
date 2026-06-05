// src/db/client.ts
// Cliente Drizzle + expo-sqlite.
// Singleton: a primeira invocação abre a DB e aplica migrações pendentes.
// As migrações são bundled em src/db/migrations/ (geradas por drizzle-kit).

import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from './schema';
import migrations from './migrations/migrations';

const DB_NAME = 'jarvis.db';

let dbInstance: ExpoSQLiteDatabase<typeof schema> | null = null;
let sqliteInstance: SQLiteDatabase | null = null;

export type JarvisDB = ExpoSQLiteDatabase<typeof schema>;

export async function getDB(): Promise<JarvisDB> {
  if (dbInstance) return dbInstance;
  sqliteInstance = await openDatabaseAsync(DB_NAME);
  dbInstance = drizzle(sqliteInstance, { schema });
  await migrate(dbInstance, migrations);
  return dbInstance;
}

export function getRawSQLite(): SQLiteDatabase | null {
  return sqliteInstance;
}

export { schema };
