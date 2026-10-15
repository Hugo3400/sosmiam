import type { PGlite } from "@electric-sql/pglite";
import { comparerSchemas, lireSchema, type Changements } from "./schema-base.ts";

export async function comparerMigration(db: PGlite, sql: string): Promise<Changements> {
  const avant = await lireSchema(db);
  await db.exec("BEGIN");
  try {
    await db.exec(sql);
    return comparerSchemas(avant, await lireSchema(db), sql);
  } finally {
    await db.exec("ROLLBACK");
  }
}
