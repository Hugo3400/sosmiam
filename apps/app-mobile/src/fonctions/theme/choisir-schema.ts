import type { ReglageApparence, SchemaCouleurs } from "~/contenus/type-apparence";

export function choisirSchema(reglage: ReglageApparence, systeme: string | null | undefined): SchemaCouleurs {
  if (reglage === "automatique") return systeme === "dark" ? "sombre" : "clair";
  return reglage;
}
