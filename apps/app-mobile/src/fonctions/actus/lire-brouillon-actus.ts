import { PHOTOS_ACTUS_MAX, RUBRIQUES_ACTUS, TEXTE_ACTUS_MAX } from "@sos-miam/commun/regles/actus";
import type { BrouillonActusSaisi } from "~/contenus/type-brouillon-actus";

const LONGUEUR_MAX = TEXTE_ACTUS_MAX * 2;

const lireTexte = (brut: unknown) => (typeof brut === "string" ? brut.slice(0, LONGUEUR_MAX) : "");

const estAdresse = (brut: unknown): brut is string => typeof brut === "string" && brut.length > 0 && brut.length < 2048;

export function lireBrouillonActus(brut: unknown): BrouillonActusSaisi | null {
  if (!brut || typeof brut !== "object") return null;
  const b = brut as Record<string, unknown>;
  const rubrique = RUBRIQUES_ACTUS.find((r) => r === b.rubrique);
  if (!rubrique) return null;
  const photos = Array.isArray(b.photos) ? b.photos.filter(estAdresse).slice(0, PHOTOS_ACTUS_MAX) : [];
  const lieux = Array.isArray(b.lieux) ? b.lieux.filter((id): id is number => Number.isInteger(id) && id >= 0).slice(0, 10) : [];
  return {
    rubrique,
    titre: lireTexte(b.titre),
    accroche: lireTexte(b.accroche),
    texte: lireTexte(b.texte),
    citation: lireTexte(b.citation),
    couverture: estAdresse(b.couverture) ? b.couverture : null,
    photos,
    lieux,
    collaboration: typeof b.collaboration === "boolean" ? b.collaboration : null,
    finSaisie: lireTexte(b.finSaisie).slice(0, 10),
  };
}
