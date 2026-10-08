import type { Lieu } from "@sos-miam/commun/types/lieu";

import type { FiltresExplorer } from "~/contenus/type-filtres-explorer";
import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

/** Les lieux qui correspondent aux filtres d'Explorer (recherche sans accents ni majuscules). */
export function filtrerLieuxExplorer(lieux: Lieu[], filtres: FiltresExplorer, maintenant: Date = new Date()): Lieu[] {
  const mots = normaliserRecherche(filtres.texte).split(" ").filter(Boolean);
  return lieux.filter((lieu) => {
    if (filtres.type !== "tous" && lieu.type !== filtres.type) return false;
    if (filtres.ville && lieu.ville !== filtres.ville) return false;
    if (filtres.budgets.length > 0 && !filtres.budgets.includes(lieu.prix)) return false;
    if (filtres.ouvertMaintenant && !estOuvertMaintenant(lieu, maintenant)) return false;
    if (mots.length === 0) return true;
    const texte = normaliserRecherche([lieu.nom, lieu.info, lieu.plat, lieu.quartier, lieu.ville, ...lieu.tags].join(" "));
    return mots.every((mot) => texte.includes(mot));
  });
}
