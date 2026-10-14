// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import type { EspaceConnexion, PageDepart } from "../../types/connexion-externe.ts";

/**
 * La page à ouvrir une fois connecté, sans « ?retour= » : « Mon compte » si l'on en vient, sinon l'accueil de l'espace
 * (/tableau pour l'espace pro, /espace pour l'espace ambassadeur).
 */
export function choisirPageApresConnexion(espace: EspaceConnexion, depart: PageDepart): string {
  if (depart === "/mon-compte" || depart === "/espace/mon-compte") return depart;
  return espace === "pro" ? "/tableau" : "/espace";
}
