import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";

export type CheminLangue = { langue: Langue | null; chemin: string };

export function lireLangueChemin(chemin: string): CheminLangue {
  if (chemin === "/en" || chemin === "/en/" || chemin === "/en.data") return { langue: "en", chemin: "/" };
  if (chemin.startsWith("/en/")) return { langue: "en", chemin: chemin.slice(3) };
  return { langue: null, chemin };
}
