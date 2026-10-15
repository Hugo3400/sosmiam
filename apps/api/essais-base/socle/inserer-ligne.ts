// Insère une ligne dans PGlite sans passer par Prisma : les colonnes obligatoires sans défaut sont remplies d'office (« x »,
// 1, faux, maintenant, {} ou []), puis celles données. Rend l'id de la ligne (0 si la table n'en a pas).
import type { PGlite } from "@electric-sql/pglite";

export async function insererLigne(db: PGlite, table: string, valeurs: Record<string, unknown>): Promise<number> {
  const colonnes = (await db.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 AND is_nullable = 'NO' AND column_default IS NULL`, [table],
  )).rows as { column_name: string; data_type: string }[];
  const tout: Record<string, unknown> = {};
  for (const c of colonnes) {
    tout[c.column_name] = c.data_type.includes("char") || c.data_type === "text" ? "x" : c.data_type.includes("int") || c.data_type === "double precision" ? 1
      : c.data_type === "boolean" ? false : c.data_type.includes("timestamp") ? new Date() : c.data_type === "jsonb" ? {} : c.data_type === "ARRAY" ? [] : "x";
  }
  Object.assign(tout, valeurs);
  const noms = Object.keys(tout);
  const r = await db.query(`INSERT INTO ${table} (${noms.map((n) => `"${n}"`).join(",")}) VALUES (${noms.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`, noms.map((n) => {
    const v = tout[n];
    return typeof v === "object" && v !== null && !(v instanceof Date) && !Array.isArray(v) ? JSON.stringify(v) : v;
  }));
  // La base d'essai rend tout en texte
  return Number((r.rows[0] as { id?: string | number }).id ?? 0);
}
