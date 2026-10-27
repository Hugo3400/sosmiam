import { PALIERS_AMBASSADEUR } from "../../../../../packages/commun/src/regles/ambassadeurs.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_AMBASSADEURS } from "~/contenus/ambassadeurs";

export type PalierAffiche = { titre: string; seuil: string; texte: string; sombre: boolean };

export function listerPaliersAmbassadeurs(textes: Traduction<typeof TEXTES_AMBASSADEURS>): PalierAffiche[] {
  return PALIERS_AMBASSADEUR.map((palier, position) => ({
    titre: textes.paliers[position].titre,
    seuil: palier.seuil === null ? textes.nommeParEquipe : textes.points(palier.seuil),
    texte: textes.paliers[position].texte,
    sombre: palier.seuil === null,
  }));
}
