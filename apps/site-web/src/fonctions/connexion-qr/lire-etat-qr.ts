// Aucun import « ~/… » ici : les tests (tests/connexion-qr.test.ts) lancent ce fichier directement avec Node.
import type { EtatQrSite } from "../../types/connexion-qr.ts";

const ETATS: EtatQrSite[] = ["attente", "scanne", "accepte", "refuse", "expire", "erreur", "trop"];

/** Un état connu (« ?qr=… » d'un retour sans JavaScript, réponse de la route d'attente), sinon null. */
export function lireEtatQr(valeur: unknown): EtatQrSite | null {
  return ETATS.find((etat) => etat === valeur) ?? null;
}
