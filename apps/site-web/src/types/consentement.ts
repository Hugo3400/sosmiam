// Consentement aux cookies : le choix gardé dans le cookie « sosmiam-consentement » (catégories dans
// src/contenus/cookies-consentement.ts, fonctions dans src/fonctions/consentement/).
import type { IdCategorieFacultative } from "../contenus/cookies-consentement.ts";

/** Réponse par catégorie : vrai = accepté, faux = refusé, absente = pas encore de réponse (le bandeau reste affiché) */
export type ReponsesConsentement = Partial<Record<IdCategorieFacultative, boolean>>;

/** Un choix enregistré. Dans le cookie, en JSON compact : {"v":version,"d":date en secondes,"c":{"publicite":0}} */
export type ChoixConsentement = {
  /** Version de la liste des partenaires au moment du choix : si elle change, le choix ne vaut plus */
  version: string;
  /** Date du choix, en millisecondes (gardée à la seconde) */
  date: number;
  reponses: ReponsesConsentement;
};

/** Où et comment poser le cookie du choix (fonctions/consentement/choisir-reglages-cookie-consentement.ts) */
export type ReglagesCookieConsentement = {
  /** « sosmiam.fr » : un seul choix pour les trois hôtes ; absent : seulement l'hôte de la page */
  domaine?: string;
  /** HTTPS seulement (vrai en ligne ; faux sur le serveur de développement, en http) */
  securise: boolean;
};

/** Ce que le serveur lit à chaque page (loader de root.tsx), sans clignotement au premier affichage */
export type EtatConsentementServeur = {
  /** Bandeau d'aperçu : « ?apercu-cookies » dans l'adresse, ou l'hôte apercu.sosmiam.fr */
  apercu: boolean;
  choix: ChoixConsentement | null;
};

/** Que montrer à la place d'un contenu d'un autre site (ContenuExterne) */
export type AffichageContenuExterne = "vignette" | "attente" | "contenu";
