// Un lieu de SOS Miam (resto, pâtisserie, bar, sortie). Données d'exemple pour l'instant, puis l'API.

import type { InfosPratiques } from "./infos-pratiques.ts";

export type TypeLieu = "resto" | "patisserie" | "bar" | "sortie";

/** Ambiances et usages d'un lieu, rapprochés des envies de la personne */
export type EnvieLieu = "terrasse" | "vege" | "amoureux" | "potes" | "famille";

/** Créneau d'ouverture : jours (0 = dimanche … 6 = samedi), heures « HH:MM » ; une fin avant le début passe minuit. */
export type CreneauOuverture = { jours: number[]; de: string; a: string };

/** SOS lancé par le lieu pour ce soir (depuis l'espace pro) */
export type SosLieu = { places: number; jusqua: string; offre?: string };

/** Coordonnées GPS d'un lieu (degrés décimaux) */
export type PositionLieu = { latitude: number; longitude: number };

export type Lieu = {
  id: number;
  nom: string;
  type: TypeLieu;
  emoji: string;
  quartier: string;
  ville: string;
  /** Où il se trouve (pour la carte et les distances) ; absent tant qu'il n'est pas placé */
  position?: PositionLieu;
  /** Distance depuis la personne, en kilomètres (calculée par l'app plus tard) */
  km: number;
  prix: "€" | "€€" | "€€€";
  prixMoyen: number;
  /** Ce que c'est, en quelques mots : « Trattoria », « Bar à cocktails »… */
  info: string;
  /** Les deux couleurs du dégradé du lieu */
  couleurs: [string, string];
  texte: string;
  rescousses: number;
  /** Message du moment : « Salle calme ce soir » */
  alerte?: string;
  sos?: SosLieu;
  horaires: string;
  ouverture: CreneauOuverture[];
  plat: string;
  tags: string[];
  envies: EnvieLieu[];
  /** Prénom de la personne qui l'a fait découvrir, s'il y en a une */
  decouvertPar?: string;
  /** Lieu qui vient d'arriver : le premier qui lui donne une rescousse devient son « premier sauveteur » */
  nouveau?: boolean;
  reservable: boolean;
  /**
   * Vrai si le lieu a un compte SOS Miam (pro) : lui seul valide les visites, lance des SOS, répond aux avis, et seul il
   * compte les rescousses et les points de visite (décidé le 9 octobre 2026). Absent ou faux : « non vérifié ».
   */
  verifie?: boolean;
  /** Téléphone, site, animaux, accès, équipements, paiements… (absent : rien à afficher) */
  pratique?: InfosPratiques;
};
