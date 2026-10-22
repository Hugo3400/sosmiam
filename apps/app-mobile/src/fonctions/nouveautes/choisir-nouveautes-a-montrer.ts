import type { NouveautesVersion } from "~/contenus/nouveautes-versions";
import { comparerVersions } from "~/fonctions/version/comparer-versions";

type Entree = {
  installee: string | null;
  vue: string | null;
  inscrit: boolean;
  versions: readonly NouveautesVersion[];
};

export type ChoixNouveautes = {
  aMontrer: NouveautesVersion | null;
  aNoterSansMontrer: string | null;
};

const RIEN: ChoixNouveautes = { aMontrer: null, aNoterSansMontrer: null };

export function choisirNouveautesAMontrer({ installee, vue, inscrit, versions }: Entree): ChoixNouveautes {
  if (installee === null) return RIEN;
  const plusRecente = vue === null || comparerVersions(installee, vue) > 0;
  if (!plusRecente) return RIEN;
  const nouveautes = versions.find((v) => comparerVersions(v.version, installee) === 0) ?? null;
  if (vue === null && !inscrit) return { aMontrer: null, aNoterSansMontrer: installee };
  if (nouveautes === null) return { aMontrer: null, aNoterSansMontrer: installee };
  return { aMontrer: nouveautes, aNoterSansMontrer: null };
}
