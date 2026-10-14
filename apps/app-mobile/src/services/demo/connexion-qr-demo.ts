import * as Crypto from "expo-crypto";

import type { CompteApp } from "@sos-miam/commun/types/compte-app";
import type { EtatConnexionQr } from "@sos-miam/commun/types/connexion-qr";
import { DELAI_ACCEPTATION_QR_S, DUREE_QR_CONNEXION_S } from "~/contenus/connexion-qr";
import type { ServiceConnexionQr } from "~/hooks/utiliser-service-connexion-qr";

// La connexion par QR code en mode démo : mêmes formes que le client du compte (packages/commun), mais tout reste sur le
// téléphone. Rien ne part sur le réseau, et la « session » rendue à l'acceptation est vide : l'écran ne l'ouvre jamais.

type DemandeDemo = {
  code: string;
  etat: EtatConnexionQr;
  creeLe: number;
  expireLe: number;
  scanneLe: number | null;
};

const ALPHABET = "abcdefghijklmnopqrstuvwxyz23456789";
const demandes = new Map<string, DemandeDemo>();

/** Le compte d'exemple rendu à l'acceptation (jamais ouvert : l'écran de la démo s'arrête avant) */
const COMPTE_DEMO: CompteApp = {
  prenom: "Camille",
  email: "camille@exemple.fr",
  points: 0,
  palier: "curieux",
  badges: [],
  creeLe: "2026-10-14T00:00:00.000Z",
  emailVerifie: true,
  age: null,
  ambassadeur: null,
  pro: { lieux: [], lieuxValides: [] },
};

function tirer(longueur: number): string {
  return [...Crypto.getRandomBytes(longueur)].map((octet) => ALPHABET[octet % ALPHABET.length]).join("");
}

function lireEtat(d: DemandeDemo, maintenant: number): EtatConnexionQr {
  const finAcceptation = d.scanneLe === null ? Infinity : d.scanneLe + DELAI_ACCEPTATION_QR_S * 1000;
  if ((d.etat === "attente" || d.etat === "scanne") && (maintenant > d.expireLe || maintenant > finAcceptation)) return "expire";
  return d.etat;
}

/** Mode démo : fait avancer la demande de ce téléphone (scan, accord ou refus sur « l'autre téléphone ») */
export function simulerConnexionQrDemo(secret: string, etat: "scanne" | "accepte" | "refuse") {
  const d = demandes.get(secret);
  if (!d) return;
  d.etat = etat;
  if (etat === "scanne") d.scanneLe = Date.now();
}

export const connexionQrDemo: ServiceConnexionQr = {
  async demanderConnexionQr() {
    const maintenant = Date.now();
    const secret = tirer(43);
    const d: DemandeDemo = {
      code: tirer(32),
      etat: "attente",
      creeLe: maintenant,
      expireLe: maintenant + DUREE_QR_CONNEXION_S * 1000,
      scanneLe: null,
    };
    demandes.set(secret, d);
    return {
      ok: true,
      code: d.code,
      secret,
      expireLe: new Date(d.expireLe).toISOString(),
    };
  },
  async attendreConnexionQr(secret) {
    const d = demandes.get(secret);
    if (!d) return { ok: true, etat: "expire" };
    const etat = lireEtat(d, Date.now());
    if (etat !== "accepte") return { ok: true, etat };
    // Une seule fois, comme l'API
    d.etat = "expire";
    return {
      ok: true,
      etat: "accepte",
      session: "",
      compte: COMPTE_DEMO,
      nouveau: false,
    };
  },
  async scannerConnexionQr(code) {
    const maintenant = Date.now();
    const locale = [...demandes.values()].find((d) => d.code === code);
    if (locale) {
      if (lireEtat(locale, maintenant) !== "attente") return { ok: false, erreur: "connexion-qr-expiree" };
      locale.etat = "scanne";
      locale.scanneLe = maintenant;
      return {
        ok: true,
        demande: {
          cible: "app",
          appareil: "l'app SOS Miam sur iPhone",
          origine: "app",
          creeLe: new Date(locale.creeLe).toISOString(),
          expireLe: new Date(locale.expireLe).toISOString(),
        },
      };
    }
    // Un QR d'ailleurs (le site, un autre téléphone de démo) : une demande d'exemple, faite il y a 8 secondes
    return {
      ok: true,
      demande: {
        cible: "site",
        appareil: "Chrome sur Mac",
        origine: "sosmiam.fr",
        creeLe: new Date(maintenant - 8000).toISOString(),
        expireLe: new Date(maintenant + 112_000).toISOString(),
      },
    };
  },
  async repondreConnexionQr(code, accepte) {
    const locale = [...demandes.values()].find((d) => d.code === code);
    if (locale) locale.etat = accepte ? "accepte" : "refuse";
    return { ok: true };
  },
};
