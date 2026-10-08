import type { CompteSuivable, VerdictSuivi } from "../types/suivis";
import { estComptePrive } from "./est-compte-prive";

/**
 * Peut-on suivre ce compte ? Dans l'ordre : pas soi-même, pas une personne bloquée (dans un sens ou dans l'autre),
 * jamais un mineur quand on est adulte, sauf un créateur de 15-17 ans (sur demande, sous surveillance accrue),
 * et entre 15 et 17 ans seulement les ados et les créateurs. Un compte privé (donc tout mineur) se suit sur demande.
 * Ne sert qu'au moment de suivre ou de demander : un lien déjà accepté n'est jamais coupé pour une raison d'âge (passage à 18 ans).
 * Les lieux ne passent pas par ici : toujours publics.
 */
export function peutSuivre(moi: { id: string; mineur: boolean }, cible: CompteSuivable, contexte: { bloque: boolean }): VerdictSuivi {
  if (cible.id === moi.id) return { permis: false, raison: "soi-meme" };
  if (contexte.bloque) return { permis: false, raison: "bloque" };
  if (cible.mineur && !moi.mineur && !cible.createur) return { permis: false, raison: "age" };
  if (moi.mineur && !cible.mineur && !cible.createur) return { permis: false, raison: "age" };
  return { permis: true, surDemande: estComptePrive(cible), surveillance: cible.mineur && !moi.mineur };
}
