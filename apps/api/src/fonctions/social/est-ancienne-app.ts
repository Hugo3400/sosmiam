import { comparerVersionsApp } from "../../../../../packages/commun/src/fonctions/texte/comparer-versions-app.ts";
import { lireVersionApp } from "../texte/lire-version-app.ts";

const PREMIERE_VERSION_MESSAGERIE_COMPLETE = "1.0.2";

export function estAncienneApp(entete: unknown): boolean {
  return comparerVersionsApp(lireVersionApp(entete), PREMIERE_VERSION_MESSAGERIE_COMPLETE) < 0;
}
