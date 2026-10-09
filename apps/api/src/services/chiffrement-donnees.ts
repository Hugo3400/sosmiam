// Chiffrement des données sensibles des comptes de l'app (nom, date de naissance), décidé le 8 octobre 2026 : AES-256-GCM,
// clé de 32 octets HORS de la base. La clé est lue UNE fois au démarrage, depuis le fichier donné par SOS_MIAM_CLE_DONNEES
// (par défaut /root/sos-miam-secrets/cle-donnees-comptes : le base64 de 32 octets, lisible par root seul). Sans clé,
// l'API démarre quand même : les adresses qui en ont besoin répondent 503 « chiffrement-indisponible ». La clé n'est
// jamais écrite dans un journal, ni rendue par une adresse.
import { readFileSync, statSync } from "node:fs";

import { chiffrerDonnee } from "../fonctions/securite/chiffrer-donnee.ts";
import { dechiffrerDonnee } from "../fonctions/securite/dechiffrer-donnee.ts";

export const FICHIER_CLE_DONNEES_DEFAUT = "/root/sos-miam-secrets/cle-donnees-comptes";

/** Champs chiffrés : le nom du champ est authentifié avec la donnée (une valeur recopiée ailleurs ne se lit plus) */
export type ChampChiffre = "nom" | "dateNaissance";

export type ChiffrementDonnees = {
  chiffrer: (texte: string, champ: ChampChiffre) => string;
  dechiffrer: (chiffre: string, champ: ChampChiffre) => string;
};

/** Le chiffrement avec cette clé (32 octets) ; les tests passent une clé de test. */
export function creerChiffrementDonnees(cle: Uint8Array): ChiffrementDonnees {
  if (cle.length !== 32) throw new Error("La clé de chiffrement doit faire 32 octets");
  const copie = Buffer.from(cle);
  return {
    chiffrer: (texte, champ) => chiffrerDonnee(texte, copie, champ),
    dechiffrer: (chiffre, champ) => dechiffrerDonnee(chiffre, copie, champ),
  };
}

/**
 * Lit la clé au démarrage. Rend null (avec un message clair au journal, sans rien de la clé) si le fichier manque, est
 * lisible par d'autres comptes que son propriétaire, ou ne contient pas le base64 de 32 octets.
 */
export function chargerChiffrementDonnees(chemin = process.env.SOS_MIAM_CLE_DONNEES || FICHIER_CLE_DONNEES_DEFAUT): ChiffrementDonnees | null {
  const indisponible = (raison: string) => {
    console.error(`Chiffrement des données des comptes INDISPONIBLE (${raison}) : ${chemin}. Inscription de l'app et profil répondent 503 « chiffrement-indisponible ».`);
    return null;
  };
  let texte: string;
  try {
    if (statSync(chemin).mode & 0o077) return indisponible("fichier de clé lisible par d'autres comptes : chmod 600");
    texte = readFileSync(chemin, "utf8");
  } catch {
    return indisponible("fichier de clé absent ou illisible");
  }
  const propre = texte.trim();
  const cle = /^[A-Za-z0-9+/]{43}=$/.test(propre) ? Buffer.from(propre, "base64") : null;
  if (!cle || cle.length !== 32) return indisponible("le fichier doit contenir le base64 de 32 octets");
  return creerChiffrementDonnees(cle);
}
