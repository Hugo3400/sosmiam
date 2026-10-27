// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_CONNEXION_EXTERNE_PAR_LANGUE } from "../../contenus/connexion-externe.ts";
import { lireCodeConnexionExterne } from "./lire-code-connexion-externe.ts";

/** Le message de « ?externe=<code> », ou null pour un code absent ou inconnu (rien de tapé dans l'adresse n'est affiché). */
export function lireMessageConnexionExterne(code: string | null, langue: Langue = LANGUE_PAR_DEFAUT): string | null {
  const connu = lireCodeConnexionExterne(code);
  return connu ? choisirTextes(TEXTES_CONNEXION_EXTERNE_PAR_LANGUE, langue).messages[connu] : null;
}
