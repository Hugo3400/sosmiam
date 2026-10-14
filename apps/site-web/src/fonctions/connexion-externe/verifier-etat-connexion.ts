// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import { timingSafeEqual } from "node:crypto";

import type { EtatConnexion, FournisseurExterne } from "../../types/connexion-externe.ts";

/**
 * Vrai si le retour d'Apple ou de Google correspond au départ gardé dans le cookie : même fournisseur, pas expiré, et le
 * même state (comparé en temps constant). Un cookie absent ou illisible (null) ne passe jamais.
 */
export function verifierEtatConnexion(etat: EtatConnexion | null, fournisseur: FournisseurExterne, stateRecu: unknown, maintenant: number): boolean {
  if (!etat || etat.fournisseur !== fournisseur || maintenant > etat.expire) return false;
  if (typeof stateRecu !== "string" || stateRecu === "") return false;
  const attendu = Buffer.from(etat.state);
  const recu = Buffer.from(stateRecu);
  return attendu.length === recu.length && timingSafeEqual(attendu, recu);
}
