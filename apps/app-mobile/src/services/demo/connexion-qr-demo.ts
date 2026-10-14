import * as Crypto from "expo-crypto";

import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { SessionOuverte } from "@sos-miam/commun/client-api/contrat-compte";
import { DELAI_ACCEPTATION_QR_S, DUREE_QR_CONNEXION_S } from "~/contenus/connexion-qr";

// La connexion par QR code dans l'aperçu de développement, en attendant les routes de l'API (session Site, contrat du
// 14/10/2026 : /comptes/qr, /comptes/qr/attente, /app/qr/scanner, /app/qr/repondre). Mêmes formes que le futur client
// commun ; rien ne part sur le réseau, et aucune vraie session n'est jamais ouverte.

export type CibleConnexionQr = "site" | "app";
export type EtatConnexionQr = "attente" | "scanne" | "accepte" | "refuse" | "expire";
/** Ce que montre l'écran de confirmation : sur quoi, depuis où (l'hôte réel qui a demandé), et quand */
export type DemandeConnexionQr = { cible: CibleConnexionQr; appareil: string; origine: string; cree: string; expireLe: string };
/** L'attente : une fois accepté, la session de l'appareil qui montrait le QR (jamais en démo) */
export type AttenteConnexionQr = { etat: Exclude<EtatConnexionQr, "accepte"> } | { etat: "accepte"; ouverte: SessionOuverte | null };

export type ServiceConnexionQr = {
  demander(cible: CibleConnexionQr): Promise<ReponseApi<{ code: string; secret: string; expireLe: string }>>;
  attendre(secret: string): Promise<ReponseApi<AttenteConnexionQr>>;
  scanner(code: string): Promise<ReponseApi<{ demande: DemandeConnexionQr }>>;
  repondre(code: string, accepte: boolean): Promise<ReponseApi>;
};

type DemandeDemo = { code: string; etat: EtatConnexionQr; creeLe: number; expireLe: number; scanneLe: number | null };

const ALPHABET = "abcdefghijklmnopqrstuvwxyz23456789";
const demandes = new Map<string, DemandeDemo>();

function tirer(longueur: number): string {
  return [...Crypto.getRandomBytes(longueur)].map((octet) => ALPHABET[octet % ALPHABET.length]).join("");
}

function lireEtat(d: DemandeDemo, maintenant: number): EtatConnexionQr {
  const finAcceptation = d.scanneLe === null ? Infinity : d.scanneLe + DELAI_ACCEPTATION_QR_S * 1000;
  if ((d.etat === "attente" || d.etat === "scanne") && (maintenant > d.expireLe || maintenant > finAcceptation)) return "expire";
  return d.etat;
}

/** Aperçu de développement : fait avancer la demande de ce téléphone (scan, accord ou refus sur « l'autre téléphone ») */
export function simulerConnexionQrDemo(secret: string, etat: "scanne" | "accepte" | "refuse") {
  const d = demandes.get(secret);
  if (!d) return;
  d.etat = etat;
  if (etat === "scanne") d.scanneLe = Date.now();
}

export const connexionQrDemo: ServiceConnexionQr = {
  async demander() {
    const maintenant = Date.now();
    const secret = tirer(43);
    const d: DemandeDemo = { code: tirer(32), etat: "attente", creeLe: maintenant, expireLe: maintenant + DUREE_QR_CONNEXION_S * 1000, scanneLe: null };
    demandes.set(secret, d);
    return { ok: true, code: d.code, secret, expireLe: new Date(d.expireLe).toISOString() };
  },
  async attendre(secret) {
    const d = demandes.get(secret);
    if (!d) return { ok: true, etat: "expire" };
    const etat = lireEtat(d, Date.now());
    return etat === "accepte" ? { ok: true, etat, ouverte: null } : { ok: true, etat };
  },
  async scanner(code) {
    const maintenant = Date.now();
    const locale = [...demandes.values()].find((d) => d.code === code);
    if (locale) {
      if (lireEtat(locale, maintenant) !== "attente") return { ok: false, erreur: "qr-expire" };
      locale.etat = "scanne";
      locale.scanneLe = maintenant;
      return { ok: true, demande: { cible: "app", appareil: "l'app SOS Miam sur iPhone", origine: "l'app", cree: new Date(locale.creeLe).toISOString(), expireLe: new Date(locale.expireLe).toISOString() } };
    }
    // Un QR d'ailleurs (le site, un autre téléphone de démo) : une demande d'exemple, faite il y a 8 secondes
    return {
      ok: true,
      demande: { cible: "site", appareil: "Chrome sur Mac", origine: "sosmiam.fr", cree: new Date(maintenant - 8000).toISOString(), expireLe: new Date(maintenant + 112_000).toISOString() },
    };
  },
  async repondre(code, accepte) {
    const locale = [...demandes.values()].find((d) => d.code === code);
    if (locale) locale.etat = accepte ? "accepte" : "refuse";
    return { ok: true };
  },
};
