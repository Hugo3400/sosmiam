// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import type { CodeConnexionExterne } from "../../contenus/connexion-externe.ts";

/** Le code montré à la personne pour une erreur de l'API (POST /comptes/apple ou /comptes/google, DELETE /comptes/moi). */
export function choisirCodeConnexionExterne(erreur: string): CodeConnexionExterne {
  if (erreur === "jeton-externe-invalide" || erreur === "champ-invalide") return "refuse";
  if (erreur === "compte-deja-rattache") return "deja-rattache";
  if (erreur === "email-manquant") return "email-manquant";
  if (erreur === "trop-de-demandes") return "trop-de-demandes";
  if (erreur === "confirmation-incorrecte") return "autre-compte";
  return "indisponible";
}
