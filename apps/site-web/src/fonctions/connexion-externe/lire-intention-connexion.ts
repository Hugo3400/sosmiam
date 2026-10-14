// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import type { IntentionConnexion } from "../../types/connexion-externe.ts";

const INTENTIONS: IntentionConnexion[] = ["connexion", "suppression", "relier", "delier"];

/** L'intention du départ (« ?intention=… ») : une des intentions connues, sinon « connexion ». */
export function lireIntentionConnexion(valeur: unknown): IntentionConnexion {
  return INTENTIONS.find((intention) => intention === valeur) ?? "connexion";
}
