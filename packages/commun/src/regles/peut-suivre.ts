import type { CompteSuivable, VerdictSuivi } from "../types/suivis";
import { estComptePrive } from "./est-compte-prive";

/**
 * Peut-on suivre ce compte ? Dans l'ordre : pas soi-même, pas une personne bloquée (dans un sens ou dans l'autre).
 * Un compte privé se suit sur demande, un compte public tout de suite.
 * Les lieux ne passent pas par ici : toujours publics.
 */
export function peutSuivre(moi: { id: string }, cible: CompteSuivable, contexte: { bloque: boolean }): VerdictSuivi {
  if (cible.id === moi.id) return { permis: false, raison: "soi-meme" };
  if (contexte.bloque) return { permis: false, raison: "bloque" };
  return { permis: true, surDemande: estComptePrive(cible) };
}
