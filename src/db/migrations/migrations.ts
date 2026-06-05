// src/db/migrations/migrations.ts
// Aggregator de migrações para o migrator do expo-sqlite.
// O expo-sqlite não aceita `migrationsFolder` — exige um objecto { journal, migrations }.
// Os ficheiros .sql e meta/_journal.json são gerados por `drizzle-kit generate`.

import m0000 from './0000_abnormal_morlocks.sql';
import journal from './meta/_journal.json';

export default {
  journal,
  migrations: {
    m0000,
  },
};
