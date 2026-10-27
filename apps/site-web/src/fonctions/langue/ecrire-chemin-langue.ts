import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { estPageDoublee } from "~/fonctions/langue/est-page-doublee";
import { lireLangueChemin } from "~/fonctions/langue/lire-langue-chemin";

export function ecrireCheminLangue(chemin: string, langue: Langue): string {
  if (!chemin.startsWith("/") || chemin.startsWith("//")) return chemin;
  const { chemin: sansLangue } = lireLangueChemin(chemin);
  if (langue === "fr" || !estPageDoublee(sansLangue)) return sansLangue;
  return sansLangue === "/" || /^\/[?#]/.test(sansLangue) ? `/en${sansLangue.slice(1)}` : `/en${sansLangue}`;
}
