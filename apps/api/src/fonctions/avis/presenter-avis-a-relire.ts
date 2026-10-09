import type { AvisARelire, NoteAvis } from "../../../../../packages/commun/src/types/avis.ts";
import type { LieuResume } from "../../../../../packages/commun/src/types/lieu-resume.ts";
import type { LigneAvis } from "../../services/avis-regles.ts";
import { calculerClesPeriodes } from "../dates/calculer-cles-periodes.ts";

/** Un avis montré à un ambassadeur pour relecture : jamais l'auteur (ni sa signature), son âge ni la réponse du lieu */
export function presenterAvisARelire(a: LigneAvis, lieu: LieuResume): AvisARelire {
  return {
    id: a.id,
    lieu,
    note: a.note as NoteAvis,
    texte: a.texte,
    photo: a.photo,
    preuve: a.preuve,
    mois: calculerClesPeriodes(a.creeLe).mois,
    raison: a.raisonRelecture ?? "tirage",
  };
}
