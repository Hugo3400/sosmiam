import { comparerVersions } from "~/fonctions/version/comparer-versions";
import { lirePartiesVersion } from "~/fonctions/version/lire-parties-version";

export type EtatVersion = { etat: "a-jour" } | { etat: "nouvelle-version"; version: string } | { etat: "obligatoire" };

type Entree = { installee: unknown; plateforme: unknown; minimale: unknown; derniere: unknown };

const A_JOUR: EtatVersion = { etat: "a-jour" };

function lirePourPlateforme(versions: unknown, plateforme: "ios" | "android"): unknown {
  if (typeof versions !== "object" || versions === null || Array.isArray(versions)) return null;
  return Object.prototype.hasOwnProperty.call(versions, plateforme) ? (versions as Record<string, unknown>)[plateforme] : null;
}

export function deciderEtatVersion({ installee, plateforme, minimale, derniere }: Entree): EtatVersion {
  if (plateforme !== "ios" && plateforme !== "android") return A_JOUR;
  if (lirePartiesVersion(installee) === null) return A_JOUR;
  if (comparerVersions(installee, lirePourPlateforme(minimale, plateforme)) < 0) return { etat: "obligatoire" };
  const proposee = lirePourPlateforme(derniere, plateforme);
  if (typeof proposee !== "string" || lirePartiesVersion(proposee) === null) return A_JOUR;
  return comparerVersions(installee, proposee) < 0 ? { etat: "nouvelle-version", version: proposee.trim() } : A_JOUR;
}
