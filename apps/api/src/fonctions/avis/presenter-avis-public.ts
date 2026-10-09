import type { AvisPublic, NoteAvis } from "../../../../../packages/commun/src/types/avis.ts";
import type { LigneAvis } from "../../services/avis-regles.ts";
import { calculerClesPeriodes } from "../dates/calculer-cles-periodes.ts";

/**
 * Un avis tel que tout le monde le voit (packages/commun, types/avis.ts) : signé, daté au mois (heure de Paris), jamais
 * l'auteur, son âge ni son statut de relecture. La réponse du lieu se montre tant que l'équipe SOS Miam ne l'a pas masquée.
 */
export function presenterAvisPublic(a: LigneAvis): AvisPublic {
  const reponseVisible = a.reponseTexte !== null && a.reponseStatut !== "masquee";
  return {
    id: a.id,
    note: a.note as NoteAvis,
    texte: a.texte,
    photo: a.photo,
    signature: a.signature,
    preuve: a.preuve,
    mois: calculerClesPeriodes(a.creeLe).mois,
    reponseLieu: reponseVisible ? { texte: a.reponseTexte!, mois: calculerClesPeriodes(a.reponseLe ?? a.creeLe).mois } : null,
    verifie: a.visiteId !== null,
    repasOffert: a.repasOffert,
    avecReduction: a.avecReduction,
  };
}
