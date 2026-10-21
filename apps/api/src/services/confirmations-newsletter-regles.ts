import type { NouvelleInscription } from "./inscriptions.ts";

export const DUREE_LIEN_CONFIRMATION_NEWSLETTER = 7 * 24 * 3600_000;
export const ATTENTE_ENTRE_ENVOIS_CONFIRMATION = 3600_000;
export const ENVOIS_MAX_CONFIRMATION = 3;
export const PAGE_CONFIRMATION_NEWSLETTER = "https://sosmiam.fr/confirmer-newsletter";

export type AttenteConfirmation = { jetonEmpreinte: string; envoyeLe: Date; expireLe: Date; envois: number };

export type NouvelleAttenteConfirmation = NouvelleInscription & AttenteConfirmation;

export type DepotConfirmationsNewsletter = {
  lireAttente: (email: string) => Promise<AttenteConfirmation | null>;
  creerAttente: (attente: NouvelleAttenteConfirmation) => Promise<boolean>;
  remplacerAttente: (ancienneEmpreinte: string, attente: NouvelleAttenteConfirmation) => Promise<boolean>;
  confirmer: (jetonEmpreinte: string, maintenant: Date) => Promise<boolean>;
};
