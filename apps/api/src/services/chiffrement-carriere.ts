import { createHmac } from "node:crypto";

import { chiffrerOctets } from "../fonctions/securite/chiffrer-octets.ts";
import { chiffrerTexteVersionne } from "../fonctions/securite/chiffrer-texte-versionne.ts";
import { dechiffrerOctets } from "../fonctions/securite/dechiffrer-octets.ts";
import { dechiffrerTexteVersionne } from "../fonctions/securite/dechiffrer-texte-versionne.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";

export const SOUS_CLES_CARRIERE = {
  textes: "sos-miam/carriere/textes/v1",
  cv: "sos-miam/carriere/cv/v1",
  empreintes: "sos-miam/carriere/empreintes/v1",
} as const;

export type ChampCandidature = "nom" | "email" | "message" | "lien";

export type ChiffrementCarriere = {
  chiffrerTexte: (texte: string, candidatureId: string, champ: ChampCandidature) => string;
  dechiffrerTexte: (chiffre: string, candidatureId: string, champ: ChampCandidature) => string;
  chiffrerCv: (octets: Uint8Array, candidatureId: string, fichier: string) => Buffer;
  dechiffrerCv: (chiffre: Uint8Array, candidatureId: string, fichier: string) => Buffer;
  calculerEmpreinteEmail: (email: string) => string;
  estAncien: (chiffre: string) => boolean;
  estAncienCv: (chiffre: Uint8Array) => boolean;
  aDesAnciennesCles: () => boolean;
};

type UsageCarriere = keyof typeof SOUS_CLES_CARRIERE;

const exigerMot = (valeur: string, quoi: string) => {
  if (!valeur || valeur.length > 80 || /[:\s]/.test(valeur)) throw new Error(`${quoi} invalide pour un contexte de chiffrement`);
  return valeur;
};
const contexteTexte = (candidatureId: string, champ: ChampCandidature) => `candidature:${exigerMot(candidatureId, "Candidature")}:${champ}`;
const contexteCv = (candidatureId: string, fichier: string) => `candidature:${exigerMot(candidatureId, "Candidature")}:cv:${exigerMot(fichier, "Fichier")}`;

export function creerChiffrementCarriere(chiffrement: ChiffrementDonnees | null): ChiffrementCarriere | null {
  if (!chiffrement) return null;
  const versionCourante = chiffrement.versionCle;
  const cles = new Map<string, Buffer | null>();
  try {
    for (const [usage, contexte] of Object.entries(SOUS_CLES_CARRIERE)) cles.set(`${usage}:${versionCourante}`, chiffrement.deriverCle(contexte));
  } catch {
    console.error("Chiffrement des candidatures INDISPONIBLE (sous-clés impossibles à tirer de la clé des données) : le dépôt d'une candidature répond 503.");
    return null;
  }
  const trouverCle = (usage: UsageCarriere) => (version: number): Buffer | null => {
    const nom = `${usage}:${version}`;
    if (!cles.has(nom)) cles.set(nom, chiffrement.deriverCleVersion(SOUS_CLES_CARRIERE[usage], version));
    return cles.get(nom) ?? null;
  };
  const courante = (usage: UsageCarriere) => {
    const cle = cles.get(`${usage}:${versionCourante}`);
    if (!cle) throw new Error("Sous-clé courante absente");
    return { version: versionCourante, cle };
  };

  return {
    chiffrerTexte: (texte, candidatureId, champ) => chiffrerTexteVersionne(texte, courante("textes"), contexteTexte(candidatureId, champ)),
    dechiffrerTexte: (chiffre, candidatureId, champ) => dechiffrerTexteVersionne(chiffre, trouverCle("textes"), contexteTexte(candidatureId, champ)),
    chiffrerCv: (octets, candidatureId, fichier) => {
      const { version, cle } = courante("cv");
      return chiffrerOctets(octets, cle, version, contexteCv(candidatureId, fichier));
    },
    dechiffrerCv: (chiffre, candidatureId, fichier) => dechiffrerOctets(chiffre, trouverCle("cv"), contexteCv(candidatureId, fichier)),
    calculerEmpreinteEmail: (email) => createHmac("sha256", courante("empreintes").cle).update(email.trim().toLowerCase(), "utf8").digest("hex"),
    estAncien: (chiffre) => chiffrement.estAncien(chiffre),
    estAncienCv: (chiffre) => chiffrement.estAncien(Buffer.from(chiffre.buffer, chiffre.byteOffset, Math.min(5, chiffre.byteLength)).toString("latin1")),
    aDesAnciennesCles: () => chiffrement.versionsAnciennes.length > 0,
  };
}
