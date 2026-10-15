import { chiffrerTexteVersionne } from "../fonctions/securite/chiffrer-texte-versionne.ts";
import { dechiffrerTexteVersionne } from "../fonctions/securite/dechiffrer-texte-versionne.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";

export const SOUS_CLE_GENRE = "sos-miam/communaute/genre/v1";

export type ChiffrementGenre = {
  chiffrer: (choix: string, compteId: number) => string;
  dechiffrer: (chiffre: string, compteId: number) => string;
  estAncien: (chiffre: string) => boolean;
};

const contexteGenre = (compteId: number) => {
  if (!Number.isSafeInteger(compteId) || compteId < 1) throw new Error("Compte invalide pour un contexte de chiffrement");
  return `compte:${compteId}:genre`;
};

export function creerChiffrementGenre(chiffrement: ChiffrementDonnees | null): ChiffrementGenre | null {
  if (!chiffrement) return null;
  const cles = new Map<number, Buffer | null>();
  try {
    cles.set(chiffrement.versionCle, chiffrement.deriverCle(SOUS_CLE_GENRE));
  } catch {
    console.error("Chiffrement du genre INDISPONIBLE (sous-clé impossible à tirer de la clé des données) : les routes du genre répondent 503.");
    return null;
  }
  const trouverCle = (version: number) => {
    if (!cles.has(version)) cles.set(version, chiffrement.deriverCleVersion(SOUS_CLE_GENRE, version));
    return cles.get(version) ?? null;
  };
  const courante = { version: chiffrement.versionCle, cle: cles.get(chiffrement.versionCle)! };
  return {
    chiffrer: (choix, compteId) => chiffrerTexteVersionne(choix, courante, contexteGenre(compteId)),
    dechiffrer: (chiffre, compteId) => dechiffrerTexteVersionne(chiffre, trouverCle, contexteGenre(compteId)),
    estAncien: (chiffre) => chiffrement.estAncien(chiffre),
  };
}
