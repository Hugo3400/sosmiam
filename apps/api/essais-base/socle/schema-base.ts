// Le schéma d'une base PGlite relevé objet par objet (tables, colonnes, index, contraintes, types énumérés, déclencheurs),
// et ce qui change entre deux relevés : ce qu'une migration ajoute, retire ou modifie (règle des migrations additives).
// Les NOT NULL sont lus sur les colonnes (PostgreSQL 18 les range aussi parmi les contraintes, type « n » : écartées).
import type { PGlite } from "@electric-sql/pglite";

/** « colonne avis.statut » → « text NOT NULL DEFAULT 'publie'::text » ; « table avis » → « » */
export type Schema = Map<string, string>;

const RELEVE = `
  SELECT 'table ' || table_name AS cle, '' AS valeur FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  UNION ALL SELECT 'colonne ' || table_name || '.' || column_name,
    data_type || CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END || COALESCE(' DEFAULT ' || column_default, '')
    FROM information_schema.columns WHERE table_schema = 'public'
  UNION ALL SELECT 'index ' || indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'
  UNION ALL SELECT 'contrainte ' || conrelid::regclass::text || '.' || conname, pg_get_constraintdef(oid)
    FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND conrelid <> 0 AND contype <> 'n'
  UNION ALL SELECT 'type ' || t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
    FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typnamespace = 'public'::regnamespace GROUP BY t.typname
  UNION ALL SELECT 'déclencheur ' || tgrelid::regclass::text || '.' || tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE NOT tgisinternal`;

export async function lireSchema(db: PGlite): Promise<Schema> {
  const lignes = (await db.query(RELEVE)).rows as { cle: string; valeur: string }[];
  return new Map(lignes.map((l) => [l.cle, l.valeur]));
}

export type Changements = {
  ajouts: string[];
  retraits: string[];
  modifications: string[];
  /** Colonnes NOT NULL sans défaut ajoutées à une table qui existait : passent sur la base d'essai (vide), pas sur une table remplie */
  risques: string[];
};

export function comparerSchemas(avant: Schema, apres: Schema): Changements {
  const ajouts = [...apres.keys()].filter((cle) => !avant.has(cle)).sort();
  const risques = ajouts.filter((cle) => {
    const table = /^colonne ([^.]+)\./.exec(cle)?.[1];
    const definition = apres.get(cle) ?? "";
    return table !== undefined && avant.has(`table ${table}`) && definition.includes("NOT NULL") && !definition.includes("DEFAULT");
  });
  return {
    ajouts,
    retraits: [...avant.keys()].filter((cle) => !apres.has(cle)).sort(),
    modifications: [...avant.keys()].filter((cle) => apres.has(cle) && apres.get(cle) !== avant.get(cle))
      .sort().map((cle) => `${cle} : ${avant.get(cle) || "(rien)"} → ${apres.get(cle) || "(rien)"}`),
    risques,
  };
}

/** Les ajouts en quelques lignes : les tables nouvelles nommées (leurs colonnes, index et contraintes comptés avec elles) */
export function resumerAjouts(ajouts: string[], apres: Schema): string[] {
  const tables = ajouts.filter((cle) => cle.startsWith("table ")).map((cle) => cle.slice(6));
  const dansNouvelles = (cle: string) => tables.some((t) => cle.includes(` ${t}.`) || / ON (public\.)?"?([a-z0-9_]+)"? /.exec(apres.get(cle) ?? "")?.[2] === t);
  const avecElles = ajouts.filter((cle) => !cle.startsWith("table ") && dansNouvelles(cle));
  const compter = (sorte: string) => avecElles.filter((cle) => cle.startsWith(`${sorte} `)).length;
  const detail = ["colonne", "index", "contrainte", "déclencheur"].filter((sorte) => compter(sorte) > 0).map((sorte) => `${sorte} : ${compter(sorte)}`).join(", ");
  const lignes = tables.length > 0 ? [`table(s) ${tables.join(", ")} (${detail})`] : [];
  return [...lignes, ...ajouts.filter((cle) => !cle.startsWith("table ") && !dansNouvelles(cle))];
}
