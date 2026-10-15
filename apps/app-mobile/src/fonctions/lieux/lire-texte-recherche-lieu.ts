import type { Lieu } from "@sos-miam/commun/types/lieu";

import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

const textes = new WeakMap<Lieu, string>();

export function lireTexteRechercheLieu(lieu: Lieu): string {
  const deja = textes.get(lieu);
  if (deja !== undefined) return deja;
  const texte = normaliserRecherche([lieu.nom, lieu.info, lieu.plat, lieu.quartier, lieu.ville, ...lieu.tags].join(" "));
  textes.set(lieu, texte);
  return texte;
}
