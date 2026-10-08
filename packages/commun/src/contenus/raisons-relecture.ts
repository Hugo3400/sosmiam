// Pourquoi un avis est proposé à la relecture, et les motifs d'un avis qui paraît louche.
// Textes neutres : ils ne disent rien de l'auteur (ni qui, ni son âge) et n'accusent pas le lieu.
// La relecture d'un ambassadeur est un avis consultatif : l'équipe tranche dans le logiciel de gestion.

import type { MotifAvisLouche, RaisonRelecture } from "../types/avis.ts";

export const LIBELLES_RAISON_RELECTURE: Readonly<Record<RaisonRelecture, string>> = {
  "rafale-notes": "Beaucoup d'avis très tranchés sur ce lieu en peu de temps",
  "compte-neuf": "Un avis parmi les tout premiers d'un compte, relu par habitude",
  "mots-filtres": "Un mot a fait tiquer notre filtre : à toi de voir s'il est à sa place",
  "lieu-sous-alerte": "On relit en ce moment les avis de ce lieu avec un peu plus d'attention",
  tirage: "Tiré au sort : on relit des avis au hasard, de temps en temps",
};

export const LIBELLES_MOTIF_AVIS_LOUCHE: Readonly<Record<MotifAvisLouche, string>> = {
  "hors-sujet": "Hors sujet : ça ne parle pas de ce lieu",
  attaque: "S'en prend à une personne",
  "faux-avis": "Ça sent le faux avis",
  "infos-perso": "Donne des infos personnelles",
  autre: "Autre chose",
};
