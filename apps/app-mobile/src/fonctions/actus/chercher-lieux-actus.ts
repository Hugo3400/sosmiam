import type { Lieu } from "@sos-miam/commun/types/lieu";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

const RESULTATS_MAX = 20;

export function chercherLieuxActus(lieux: readonly Lieu[], recherche: string, exclus: readonly number[]): Lieu[] {
  const mots = normaliserRecherche(recherche).split(" ").filter(Boolean);
  if (mots.length === 0) return [];
  const deja = new Set(exclus);
  return lieux
    .filter((lieu) => {
      if (deja.has(lieu.id)) return false;
      const fiche = normaliserRecherche(`${lieu.nom} ${lieu.quartier} ${lieu.ville}`);
      return mots.every((mot) => fiche.includes(mot));
    })
    .slice(0, RESULTATS_MAX);
}
