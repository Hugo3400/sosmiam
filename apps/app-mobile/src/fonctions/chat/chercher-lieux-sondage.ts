import type { Lieu } from "@sos-miam/commun/types/lieu";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

export function chercherLieuxSondage<L extends Pick<Lieu, "nom" | "info" | "plat" | "quartier" | "ville">>(lieux: readonly L[], texte: string): L[] {
  const mots = normaliserRecherche(texte).split(" ").filter(Boolean);
  if (mots.length === 0) return [...lieux];
  return lieux.filter((l) => {
    const fiche = normaliserRecherche([l.nom, l.info, l.plat, l.quartier, l.ville].join(" "));
    return mots.every((mot) => fiche.includes(mot));
  });
}
