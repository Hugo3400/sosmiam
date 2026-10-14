// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import { randomBytes } from "node:crypto";

import type { EtatConnexion, FournisseurExterne, IntentionConnexion, PageDepart } from "../../types/connexion-externe.ts";

/** Durée de vie du départ : 10 minutes pour revenir d'Apple ou de Google */
export const DUREE_ETAT_CONNEXION = 10 * 60_000;

type Demande = { fournisseur: FournisseurExterne; intention: IntentionConnexion; depart: PageDepart; retour: string };

/** Un départ tout neuf : state et nonce tirés au hasard (32 octets chacun, en base64url), valable 10 minutes. */
export function creerEtatConnexion(demande: Demande, maintenant: number): EtatConnexion {
  return {
    ...demande,
    state: randomBytes(32).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    expire: maintenant + DUREE_ETAT_CONNEXION,
  };
}
