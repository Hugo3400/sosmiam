// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import { messagesConnexionExterne, type CodeConnexionExterne } from "../../contenus/connexion-externe.ts";

/** Le message de « ?externe=<code> », ou null pour un code absent ou inconnu (rien de tapé dans l'adresse n'est affiché). */
export function lireMessageConnexionExterne(code: string | null): string | null {
  return code !== null && Object.hasOwn(messagesConnexionExterne, code) ? messagesConnexionExterne[code as CodeConnexionExterne] : null;
}
