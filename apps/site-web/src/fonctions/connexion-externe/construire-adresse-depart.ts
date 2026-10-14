// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import type { FournisseurExterne, IntentionConnexion, PageDepart } from "../../types/connexion-externe.ts";

/** L'adresse d'un bouton « Continuer avec … » : /connexion/<fournisseur>?depart=…[&retour=…][&intention=suppression]. */
export function construireAdresseDepart(fournisseur: FournisseurExterne, depart: PageDepart, retour?: string | null, intention: IntentionConnexion = "connexion"): string {
  const parametres = new URLSearchParams({ depart, ...(retour ? { retour } : {}), ...(intention === "suppression" ? { intention } : {}) });
  return `/connexion/${fournisseur}?${parametres.toString()}`;
}
