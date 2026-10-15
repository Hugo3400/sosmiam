import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import { listerCreneauxReservation } from "@sos-miam/commun/fonctions/reservations/lister-creneaux-reservation";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { DemandeReservation, Reservation } from "@sos-miam/commun/types/reservation";

import { lieuDemoPro } from "~/contenus/lieu-demo-pro";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import type { JourReservation } from "~/contenus/type-jour-reservation";
import { ecrireCreneauIso } from "~/fonctions/reservations/ecrire-creneau-iso";
import { estFermeCeJour } from "~/fonctions/reservations/est-ferme-ce-jour";
import { listerJoursReservation } from "~/fonctions/reservations/lister-jours-reservation";

export type RefusExempleReservation = { erreur: ErreurService; details?: DetailsErreur };

type ReponseExempleReservation = { libelle: string; refus: RefusExempleReservation | null };

export const TEXTES_APERCU_RESERVER_TABLE = {
  titre: "🧪 Aperçu",
  texte: " : des données d'exemple, rien ne part au lieu. Choisis ce que répond « Envoyer ma demande ».",
} as const;

export const REPONSES_EXEMPLE_RESERVATION: readonly ReponseExempleReservation[] = [
  { libelle: "Ça part", refus: null },
  { libelle: "Pas de résa ici", refus: { erreur: "lieu-non-reservable" } },
  { libelle: "Créneau passé", refus: { erreur: "creneau-invalide" } },
  { libelle: "Déjà une demande ici", refus: { erreur: "reservation-en-cours" } },
  { libelle: "3 résas à venir", refus: { erreur: "trop-de-reservations" } },
  { libelle: "Trop d'essais", refus: { erreur: "trop-de-demandes" } },
  { libelle: "E-mail à confirmer", refus: { erreur: "email-non-verifie" } },
  { libelle: "Ton propre lieu", refus: { erreur: "membre-du-lieu" } },
  { libelle: "Petit mot refusé", refus: { erreur: "message-refuse" } },
  { libelle: "Compte limité", refus: { erreur: "compte-limite" } },
  { libelle: "Pas de réseau", refus: { erreur: "hors-ligne" } },
];

const REFUS_QUI_VISENT_LE_PETIT_MOT: readonly ErreurService[] = ["compte-limite", "message-refuse"];

export function trouverLieuExempleReservation(id: string | undefined): Lieu {
  return lieuxExemples.find((lieu) => String(lieu.id) === id) ?? lieuDemoPro;
}

export function lireJoursExemple(lieu: Lieu, maintenant: Date): JourReservation[] {
  return listerJoursReservation(maintenant).map((jour) => ({
    jour,
    ferme: estFermeCeJour(lieu.ouverture, jour),
    creneaux: listerCreneauxReservation(lieu.ouverture, jour, maintenant),
  }));
}

export function lireRefusExemple(reponse: number, demande: DemandeReservation, lieu: Lieu): RefusExempleReservation | null {
  const refus = REPONSES_EXEMPLE_RESERVATION[reponse]?.refus ?? null;
  if (!refus) return null;
  if (REFUS_QUI_VISENT_LE_PETIT_MOT.includes(refus.erreur) && demande.message === null) return null;
  return { ...refus, details: { lieu: lieu.nom, lieuId: lieu.id } };
}

export function creerReservationExemple(lieu: Lieu, demande: DemandeReservation, maintenant: Date): Reservation {
  return {
    id: 1,
    lieu: { id: lieu.id, nom: lieu.nom, emoji: lieu.emoji, type: lieu.type, ville: lieu.ville },
    personnes: demande.personnes,
    creneau: ecrireCreneauIso(demande.jour, demande.heure),
    message: demande.message?.trim().replace(/\s+/g, " ") || null,
    statut: "demandee",
    motifRefus: null,
    tardive: false,
    creeLe: maintenant.toISOString(),
    reponduLe: null,
    presenceLe: null,
    code: null,
    visiteId: null,
    demo: true,
  };
}
