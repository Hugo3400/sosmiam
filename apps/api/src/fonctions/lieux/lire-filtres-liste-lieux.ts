import type { TypeLieu } from "../../../../../packages/commun/src/types/lieu.ts";

export type FiltresListeLieux = { ville: string | null; type: TypeLieu | null; recherche: string | null; page: number };

const TYPES: ReadonlySet<string> = new Set<TypeLieu>(["resto", "patisserie", "bar", "sortie"]);
export const PAGE_LIEUX_MAX = 1000;

const lireTexte = (brut: unknown, longueurMax: number): string | null => {
  if (typeof brut !== "string") return null;
  const texte = brut.trim().replace(/\s+/g, " ");
  return texte ? texte.slice(0, longueurMax) : null;
};

export function lireFiltresListeLieux(requete: Record<string, unknown>): FiltresListeLieux {
  const type = typeof requete.type === "string" && TYPES.has(requete.type) ? (requete.type as TypeLieu) : null;
  const page = typeof requete.page === "string" && /^\d{1,4}$/.test(requete.page) ? Number(requete.page) : 1;
  return {
    ville: lireTexte(requete.ville, 80),
    type,
    recherche: lireTexte(requete.q, 60),
    page: Math.min(Math.max(page, 1), PAGE_LIEUX_MAX),
  };
}
