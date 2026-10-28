import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Lieu } from "@sos-miam/commun/types/lieu";

import { TEXTES_SUIVI_PAR_LANGUE } from "~/contenus/textes-suivi";
import type { Publication } from "~/contenus/type-publication";
import { trouverVilleCreateur } from "~/fonctions/suivi/trouver-ville-createur";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

type Entree = {
  /** Publications qu'on peut montrer (sans celles masquées, seulement sur des lieux de `lieux`) */
  publications: readonly Publication[];
  /** Lieux qu'on peut montrer (sans bar en visite sans compte : filtrerLieuxSelonAge) */
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
export function suggererCreateurs({ publications, lieux, ville, exclus }: Entree, langue: Langue): { pseudo: string; raison: string }[] {
  const T = choisirTextes(TEXTES_SUIVI_PAR_LANGUE, langue).raisons;
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
    if (maVille && sienne && normaliserRecherche(sienne) === maVille) deTaVille.push({ pseudo, raison: T.createurA(sienne) });
    else populaires.push({ pseudo, raison: T.populaire });
  }
  return [...deTaVille, ...populaires];
}
