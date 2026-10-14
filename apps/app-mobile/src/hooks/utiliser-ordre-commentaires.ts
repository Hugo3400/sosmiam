import { useState } from "react";

import type { FilCommentaire } from "@sos-miam/commun/fonctions/commentaires/trier-commentaires";

/** Le rang de chaque commentaire à l'ouverture, et la date du plus récent d'alors */
type Ordre = { rangs: ReadonlyMap<string, number>; plusRecent: number };

const dateDe = (f: FilCommentaire) => Date.parse(f.commentaire.date) || 0;

/**
 * L'ordre des commentaires de la feuille, figé dès que la liste est lue : un J'aime ne fait pas sauter un commentaire sous ton
 * doigt. La réponse du lieu reste en tête, puis ce qui est arrivé depuis l'ouverture (tes commentaires tout frais, en haut pour
 * que tu les voies), puis les autres dans l'ordre de l'ouverture (plus aimés, plus récents). Les plus anciens chargés ensuite
 * (« Voir les commentaires plus anciens ») se rangent à la fin, dans l'ordre où ils arrivent. `oublier` : on repart de la
 * liste (réouverture de la feuille).
 */
export function utiliserOrdreCommentaires(fils: FilCommentaire[], lue: boolean): { ordonnes: FilCommentaire[]; oublier: () => void } {
  const [ordre, setOrdre] = useState<Ordre | null>(null);
  if (ordre === null && lue) setOrdre({ rangs: new Map(fils.map((f, index) => [f.commentaire.id, index])), plusRecent: Math.max(0, ...fils.map(dateDe)) });

  // Inconnus mais pas plus récents que l'ouverture : la suite de la liste, rangée au bout
  const anciens = ordre ? fils.filter((f) => !ordre.rangs.has(f.commentaire.id) && dateDe(f) <= ordre.plusRecent) : [];
  if (ordre && anciens.length > 0) {
    const rangs = new Map(ordre.rangs);
    anciens.forEach((f) => rangs.set(f.commentaire.id, rangs.size));
    setOrdre({ ...ordre, rangs });
  }

  const oublier = () => setOrdre(null);
  if (!ordre) return { ordonnes: fils, oublier };
  const rang = (f: FilCommentaire) => ordre.rangs.get(f.commentaire.id) ?? -1;
  const connus = fils.filter((f) => rang(f) >= 0).sort((a, b) => rang(a) - rang(b));
  const nouveaux = fils.filter((f) => rang(f) < 0).sort((a, b) => b.commentaire.date.localeCompare(a.commentaire.date));
  const estLieu = (f: FilCommentaire) => f.commentaire.auteur === "lieu";
  return { ordonnes: [...connus.filter(estLieu), ...nouveaux, ...connus.filter((f) => !estLieu(f))], oublier };
}
