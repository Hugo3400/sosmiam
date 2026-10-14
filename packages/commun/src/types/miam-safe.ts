// Formes de Miam Safe partagées par l'app, le site et l'API (contrat : apps/api/src/routes/miam-safe.ts).
import type { EndroitAlerte } from "../regles/miam-safe.ts";
import type { PersonneResume } from "./social.ts";

/** Ce que la fiche d'un lieu montre : charte signée, et « Les Miamis s'y sentent bien » (90 % de oui sur 20 réponses) */
export type MiamSafeLieu = { engage: boolean; repere: boolean };

/** « envoyee » (en attente), « en-route » (« On arrive » de l'équipe), « sans-reponse » (2 minutes sans réponse) */
export type StatutAlerteMiamSafe = "envoyee" | "en-route" | "sans-reponse";

/** Une alerte telle que la personne qui l'a envoyée la suit */
export type AlerteSuivie = { id: number; statut: StatutAlerteMiamSafe; creeLe: string; repondueLe: string | null };

/** Une alerte telle que l'équipe du lieu la voit au comptoir : le prénom, jamais le nom ni la photo */
export type AlerteComptoir = { id: number; prenom: string; endroit: EndroitAlerte; detail: string; statut: StatutAlerteMiamSafe; creeLe: string };

/** La charte d'un lieu ; retireeParEquipe : l'équipe SOS Miam l'a retirée, seule elle peut la rendre */
export type CharteMiamSafe = { signee: boolean; signeeLe: string | null; retireeParEquipe: boolean };

/** Une position envoyée par le téléphone de la personne qui partage ; precisionM : le rayon annoncé, en mètres */
export type PositionMiamSafe = { latitude: number; longitude: number; precisionM: number | null };

/**
 * « Prévenir un pote » : un partage de position, vu par la personne qui partage (« envoye ») ou par son pote (« recu »).
 * personne : l'autre (le pote, ou la personne qui partage). position : la dernière reçue (le : quand), null s'il n'y en a pas
 * ou si le partage est fini. actif : ni arrêté, ni passé l'heure.
 */
export type PartagePositionMiamSafe = {
  id: number;
  sens: "envoye" | "recu";
  personne: PersonneResume;
  lieu: { id: number; nom: string } | null;
  position: (PositionMiamSafe & { le: string }) | null;
  creeLe: string;
  expireLe: string;
  actif: boolean;
};
