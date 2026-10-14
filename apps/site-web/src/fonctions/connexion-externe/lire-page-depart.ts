// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import type { PageDepart } from "../../types/connexion-externe.ts";

const PAGES: PageDepart[] = ["/connexion", "/inscription", "/mon-compte", "/espace/mon-compte"];

/** La page qui a montré les boutons (pour y revenir) : une des pages connues, sinon /connexion. */
export function lirePageDepart(valeur: unknown): PageDepart {
  return PAGES.find((page) => page === valeur) ?? "/connexion";
}
