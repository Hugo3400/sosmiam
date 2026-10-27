import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_SIGNALER_IMAGE_PAR_LANGUE } from "~/contenus/signaler-image";
import type { ChampSignalerImage, CodeErreurSignalerImage } from "~/fonctions/lieux/lire-formulaire-signaler-image";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const CHAMPS: readonly ChampSignalerImage[] = ["quelle", "raison", "explication"];

export function ecrireErreursSignalerImage(codes: Partial<Record<ChampSignalerImage, CodeErreurSignalerImage>>, langue: Langue): Partial<Record<ChampSignalerImage, string>> {
  const textes = choisirTextes(TEXTES_SIGNALER_IMAGE_PAR_LANGUE, langue).erreurs;
  const erreurs: Partial<Record<ChampSignalerImage, string>> = {};
  for (const champ of CHAMPS) {
    const code = codes[champ];
    if (code) erreurs[champ] = lierPonctuation(textes[code]);
  }
  return erreurs;
}
