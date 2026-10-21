import { lirePartiesVersion } from "~/fonctions/version/lire-parties-version";

const ZERO: readonly number[] = [0, 0, 0];

export function comparerVersions(a: unknown, b: unknown): -1 | 0 | 1 {
  const gauche = lirePartiesVersion(a) ?? ZERO;
  const droite = lirePartiesVersion(b) ?? ZERO;
  for (let i = 0; i < 3; i++) {
    if (gauche[i] !== droite[i]) return gauche[i] < droite[i] ? -1 : 1;
  }
  return 0;
}
