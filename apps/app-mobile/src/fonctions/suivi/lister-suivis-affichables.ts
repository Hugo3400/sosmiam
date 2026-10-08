import type { Lieu } from "@sos-miam/commun/types/lieu";

import { publicationsExemples } from "~/contenus/publications-exemples";
import type { Publication } from "~/contenus/type-publication";
import { lireCleSuivi } from "~/fonctions/suivi/lire-cle-suivi";

/** Un suivi qu'on peut montrer : son lieu, ou son créateur avec toutes ses publications */
export type SuiviAffichable = { cle: string; type: "lieu"; lieu: Lieu } | { cle: string; type: "createur"; pseudo: string; publications: Publication[] };

/**
 * Les suivis à montrer (liste « Tu suis » et son compte sur le profil), dans l'ordre reçu : les lieux encore là parmi `lieux`
 * (déjà filtrés selon ton âge) et les créateurs qui ont au moins une publication. Une clé abîmée ou inconnue est ignorée.
 */
export function listerSuivisAffichables(cles: readonly string[], lieux: readonly Lieu[]): SuiviAffichable[] {
  return cles.flatMap((cle): SuiviAffichable[] => {
    const cible = lireCleSuivi(cle);
    if (cible?.type === "lieu") {
      const lieu = lieux.find((l) => l.id === cible.id);
      return lieu ? [{ cle, type: "lieu", lieu }] : [];
    }
    if (cible?.type === "createur") {
      const publications = publicationsExemples.filter((p) => p.auteur.type === "createur" && p.auteur.pseudo === cible.pseudo);
      return publications.length > 0 ? [{ cle, type: "createur", pseudo: cible.pseudo, publications }] : [];
    }
    return [];
  });
}
