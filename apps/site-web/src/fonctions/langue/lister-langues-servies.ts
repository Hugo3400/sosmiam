import { LANGUES, LANGUES_OUVERTES_SITE, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";

const HOTES_D_ESSAI = ["apercu.sosmiam.fr", "localhost", "127.0.0.1", "pro.localhost"];

export function listerLanguesServies(hote: string, ouvertes: readonly Langue[] = LANGUES_OUVERTES_SITE): readonly Langue[] {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return HOTES_D_ESSAI.includes(nomHote) ? LANGUES : ouvertes;
}
