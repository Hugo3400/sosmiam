import type { Lieu } from "@sos-miam/commun/types/lieu";

import type { Publication } from "~/contenus/type-publication";
import { trouverVilleCreateur } from "~/fonctions/suivi/trouver-ville-createur";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

type Entree = {
  /** Publications qu'on peut montrer (sans celles masquées, seulement sur des lieux de `lieux`) */
  publications: readonly Publication[];
  /** Lieux que ton âge permet */
  lieux: readonly Lieu[];
  /** Ta ville (profil), ou null si on ne la connaît pas */
  ville: string | null;
  /** Pseudos à ne pas proposer (déjà suivis, suggestions masquées) */
  exclus: ReadonlySet<string>;
};

/**
 * Créateurs à suivre : d'abord ceux de ta ville (« Créateur à Montpellier », la ville de leurs publications comparée sans accents
 * ni majuscules), puis, en repli, les plus aimés (« Populaire sur SOS Miam ») ; dans chaque groupe, du plus aimé au moins aimé.
 * Jamais « de ta ville » à tort : sans ville connue, tout le monde est « Populaire ».
 */
export function suggererCreateurs({ publications, lieux, ville, exclus }: Entree): { pseudo: string; raison: string }[] {
  const jaimes = new Map<string, number>();
  for (const publication of publications) {
    if (publication.auteur.type !== "createur" || !lieux.some((lieu) => lieu.id === publication.lieuId)) continue;
    const { pseudo } = publication.auteur;
    jaimes.set(pseudo, (jaimes.get(pseudo) ?? 0) + publication.jaimes);
  }
  const maVille = ville ? normaliserRecherche(ville) : "";
  const candidats = [...jaimes.keys()].filter((pseudo) => !exclus.has(pseudo)).sort((a, b) => (jaimes.get(b) ?? 0) - (jaimes.get(a) ?? 0));

  const deTaVille: { pseudo: string; raison: string }[] = [];
  const populaires: { pseudo: string; raison: string }[] = [];
  for (const pseudo of candidats) {
    const sienne = trouverVilleCreateur(pseudo, publications, lieux);
    if (maVille && sienne && normaliserRecherche(sienne) === maVille) deTaVille.push({ pseudo, raison: `Créateur à ${sienne}` });
    else populaires.push({ pseudo, raison: "Populaire sur SOS Miam" });
  }
  return [...deTaVille, ...populaires];
}
