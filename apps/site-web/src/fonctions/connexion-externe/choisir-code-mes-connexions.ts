// Aucun import « ~/… » ici : les tests (tests/mes-connexions.test.ts) lancent ce fichier directement avec Node.
import type { CodeMesConnexions } from "../../contenus/mes-connexions.ts";

/** Le code montré après une erreur de l'API (POST ou DELETE /comptes/moi/connexions/…). */
export function choisirCodeMesConnexions(erreur: string): CodeMesConnexions {
  if (erreur === "identite-deja-reliee" || erreur === "deja-relie" || erreur === "derniere-connexion" || erreur === "trop-de-demandes") return erreur;
  if (erreur === "jeton-externe-invalide" || erreur === "champ-invalide") return "refuse";
  if (erreur === "confirmation-incorrecte") return "autre-compte";
  return "indisponible";
}
