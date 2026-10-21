import { createHmac } from "node:crypto";

import { chiffrerOctets } from "../fonctions/securite/chiffrer-octets.ts";
import { chiffrerTexteVersionne } from "../fonctions/securite/chiffrer-texte-versionne.ts";
import { dechiffrerOctets } from "../fonctions/securite/dechiffrer-octets.ts";
import { dechiffrerTexteVersionne } from "../fonctions/securite/dechiffrer-texte-versionne.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";

export const SOUS_CLES_SECURITE = {
  textes: "sos-miam/securite/textes/v1",
  images: "sos-miam/securite/images/v1",
  empreintes: "sos-miam/securite/empreintes/v1",
} as const;

export type ChampSignalement = "nom" | "email" | "titre" | "description" | "lien" | "nomTableauHonneur";

export type ChiffrementSecurite = {
  chiffrerTexte: (texte: string, signalementId: string, champ: ChampSignalement) => string;
  dechiffrerTexte: (chiffre: string, signalementId: string, champ: ChampSignalement) => string;
  chiffrerImage: (octets: Uint8Array, signalementId: string, fichier: string) => Buffer;
  dechiffrerImage: (chiffre: Uint8Array, signalementId: string, fichier: string) => Buffer;
  calculerEmpreinteEmail: (email: string) => string;
  estAncien: (chiffre: string) => boolean;
  estAncienneImage: (chiffre: Uint8Array) => boolean;
  aDesAnciennesCles: () => boolean;
};

type UsageSecurite = keyof typeof SOUS_CLES_SECURITE;

const exigerMot = (valeur: string, quoi: string) => {
  if (!valeur || valeur.length > 80 || /[:\s]/.test(valeur)) throw new Error(`${quoi} invalide pour un contexte de chiffrement`);
  return valeur;
};
const contexteTexte = (signalementId: string, champ: ChampSignalement) => `signalement-securite:${exigerMot(signalementId, "Signalement")}:${champ}`;
const contexteImage = (signalementId: string, fichier: string) => `signalement-securite:${exigerMot(signalementId, "Signalement")}:image:${exigerMot(fichier, "Fichier")}`;

export function creerChiffrementSecurite(chiffrement: ChiffrementDonnees | null): ChiffrementSecurite | null {
  if (!chiffrement) return null;
  const versionCourante = chiffrement.versionCle;
  const cles = new Map<string, Buffer | null>();
  try {
    for (const [usage, contexte] of Object.entries(SOUS_CLES_SECURITE)) cles.set(`${usage}:${versionCourante}`, chiffrement.deriverCle(contexte));
  } catch {
    console.error("Chiffrement des signalements de sécurité INDISPONIBLE (sous-clés impossibles à tirer de la clé des données) : le dépôt d'un signalement répond 503.");
    return null;
  }
  const trouverCle = (usage: UsageSecurite) => (version: number): Buffer | null => {
    const nom = `${usage}:${version}`;
    if (!cles.has(nom)) cles.set(nom, chiffrement.deriverCleVersion(SOUS_CLES_SECURITE[usage], version));
    return cles.get(nom) ?? null;
  };
  const courante = (usage: UsageSecurite) => {
    const cle = cles.get(`${usage}:${versionCourante}`);
    if (!cle) throw new Error("Sous-clé courante absente");
    return { version: versionCourante, cle };
  };

  return {
    chiffrerTexte: (texte, signalementId, champ) => chiffrerTexteVersionne(texte, courante("textes"), contexteTexte(signalementId, champ)),
    dechiffrerTexte: (chiffre, signalementId, champ) => dechiffrerTexteVersionne(chiffre, trouverCle("textes"), contexteTexte(signalementId, champ)),
    chiffrerImage: (octets, signalementId, fichier) => {
      const { version, cle } = courante("images");
      return chiffrerOctets(octets, cle, version, contexteImage(signalementId, fichier));
    },
    dechiffrerImage: (chiffre, signalementId, fichier) => dechiffrerOctets(chiffre, trouverCle("images"), contexteImage(signalementId, fichier)),
    calculerEmpreinteEmail: (email) => createHmac("sha256", courante("empreintes").cle).update(email.trim().toLowerCase(), "utf8").digest("hex"),
    estAncien: (chiffre) => chiffrement.estAncien(chiffre),
    estAncienneImage: (chiffre) => chiffrement.estAncien(Buffer.from(chiffre.buffer, chiffre.byteOffset, Math.min(5, chiffre.byteLength)).toString("latin1")),
    aDesAnciennesCles: () => chiffrement.versionsAnciennes.length > 0,
  };
}
