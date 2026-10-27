import { PHOTOS_ACTUS_MAX, RUBRIQUES_ACTUS } from "../../../../../packages/commun/src/regles/actus.ts";
import type { CorpsArticleActus } from "../../../../../packages/commun/src/types/actus.ts";

export type { CorpsArticleActus };

const LONGUEUR_BRUTE_MAX = 6000;
const LIEUX_MAX = 10;

const lireTexte = (brut: unknown) => (typeof brut === "string" && brut.length <= LONGUEUR_BRUTE_MAX ? brut : null);

export function lireCorpsArticleActus(brut: unknown): CorpsArticleActus | null {
  if (!brut || typeof brut !== "object" || Array.isArray(brut)) return null;
  const c = brut as Record<string, unknown>;
  const rubrique = RUBRIQUES_ACTUS.find((r) => r === c.rubrique);
  const titre = lireTexte(c.titre);
  const accroche = lireTexte(c.accroche);
  const texte = lireTexte(c.texte);
  const citation = c.citation === null || c.citation === undefined ? "" : lireTexte(c.citation);
  if (!rubrique || titre === null || accroche === null || texte === null || citation === null || typeof c.couverture !== "string") return null;
  if (!Array.isArray(c.photos) || c.photos.length > PHOTOS_ACTUS_MAX || !c.photos.every((p) => typeof p === "string")) return null;
  if (!Array.isArray(c.lieux) || c.lieux.length > LIEUX_MAX || !c.lieux.every((id) => Number.isSafeInteger(id))) return null;
  if (c.collaboration !== null && typeof c.collaboration !== "boolean") return null;
  if (c.finLe !== null && c.finLe !== undefined && typeof c.finLe !== "string") return null;
  return {
    rubrique, titre, accroche, texte, citation,
    couverture: c.couverture,
    photos: c.photos as string[],
    lieux: c.lieux as number[],
    collaboration: c.collaboration as boolean | null,
    finLe: typeof c.finLe === "string" ? c.finLe : null,
  };
}
