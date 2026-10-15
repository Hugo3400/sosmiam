import type { LieuResume } from "@sos-miam/commun/types/lieu-resume";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { LIEU_DEMO_PRO_ID } from "~/contenus/lieu-demo-pro";

const MINUTE = 60_000;
const DEMI_HEURE = 30 * MINUTE;

const nonnaLia: LieuResume = { id: 0, nom: "Chez Nonna Lia", emoji: "🍝", type: "resto", ville: "Montpellier" };
const capitaine: LieuResume = { id: LIEU_DEMO_PRO_ID, nom: "Restaurant du Capitaine Bouiboui", emoji: "🛟", type: "resto", ville: "Montpellier" };
const cabaneEmile: LieuResume = { id: 13, nom: "La Cabane d'Émile", emoji: "🦪", type: "resto", ville: "Bouzigues" };
const tiellePepita: LieuResume = { id: 9, nom: "La Tielle de Pépita", emoji: "🐙", type: "resto", ville: "Sète" };
const pagaiesLez: LieuResume = { id: 6, nom: "Les Pagaies du Lez", emoji: "🛶", type: "sortie", ville: "Montpellier" };
const toquesLergue: LieuResume = { id: 16, nom: "Les Toqués de la Lergue", emoji: "🧀", type: "resto", ville: "Lodève" };
const paddleFlamants: LieuResume = { id: 12, nom: "Paddle & Flamants", emoji: "🏄", type: "sortie", ville: "Palavas-les-Flots" };
const gadoue: LieuResume = { id: 8, nom: "Gadoue & Cie", emoji: "🏺", type: "sortie", ville: "Montpellier" };
const cleRuelles: LieuResume = { id: 7, nom: "La Clé des Ruelles", emoji: "🗝️", type: "sortie", ville: "Montpellier" };

export const clientExempleReservations = { prenom: "Hugo R.", avatar: "🦊" };

type ChampsExemple = Pick<Reservation, "id" | "lieu" | "personnes" | "creneau" | "statut"> & Partial<Reservation>;

function poserDansJours(maintenantMs: number, jours: number, heures: number, minutes = 0): string {
  const date = new Date(maintenantMs);
  date.setDate(date.getDate() + jours);
  date.setHours(heures, minutes, 0, 0);
  return date.toISOString();
}

const poserProchaineDemiHeure = (maintenantMs: number) => new Date(Math.ceil((maintenantMs + 10 * MINUTE) / DEMI_HEURE) * DEMI_HEURE).toISOString();

const decaler = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * MINUTE).toISOString();

function creerReservationExemple(champs: ChampsExemple): Reservation {
  return {
    message: null,
    motifRefus: null,
    tardive: false,
    creeLe: decaler(champs.creneau, -2 * 24 * 60),
    reponduLe: null,
    presenceLe: null,
    code: null,
    visiteId: null,
    demo: false,
    ...champs,
  };
}

export function creerReservationsExemples(maintenantMs: number): Reservation[] {
  const ceSoir = poserProchaineDemiHeure(maintenantMs);
  const demain = poserDansJours(maintenantMs, 1, 20);
  const dansDeuxJours = poserDansJours(maintenantMs, 2, 20, 30);
  const dansTroisJours = poserDansJours(maintenantMs, 3, 12, 30);
  const dansQuatreJours = poserDansJours(maintenantMs, 4, 10);
  const ilYaCinqJours = poserDansJours(maintenantMs, -5, 20);
  const ilYaNeufJours = poserDansJours(maintenantMs, -9, 10, 30);
  const ilYaDouzeJours = poserDansJours(maintenantMs, -12, 13);
  const ilYaVingtJours = poserDansJours(maintenantMs, -20, 15);
  const ilYaVingtSixJours = poserDansJours(maintenantMs, -26, 18);

  return [
    creerReservationExemple({
      id: 9101,
      lieu: nonnaLia,
      personnes: 2,
      creneau: ceSoir,
      statut: "acceptee",
      message: "On fête les 30 ans de Léa, une bougie sur le tiramisu ce serait le rêve !",
      creeLe: decaler(ceSoir, -26 * 60),
      reponduLe: decaler(ceSoir, -25 * 60),
      code: "4821",
    }),
    creerReservationExemple({ id: 9102, lieu: capitaine, personnes: 4, creneau: demain, statut: "demandee", creeLe: new Date(maintenantMs - 12 * MINUTE).toISOString() }),
    creerReservationExemple({
      id: 9103,
      lieu: tiellePepita,
      personnes: 6,
      creneau: dansDeuxJours,
      statut: "refusee",
      motifRefus: "complet",
      reponduLe: decaler(dansDeuxJours, -40 * 60),
    }),
    creerReservationExemple({ id: 9104, lieu: cabaneEmile, personnes: 2, creneau: dansTroisJours, statut: "acceptee", reponduLe: decaler(dansTroisJours, -47 * 60), code: "1907" }),
    creerReservationExemple({
      id: 9105,
      lieu: pagaiesLez,
      personnes: 3,
      creneau: dansQuatreJours,
      statut: "annulee",
      motifRefus: "ferme",
      reponduLe: decaler(dansQuatreJours, -30 * 60),
    }),
    creerReservationExemple({
      id: 9106,
      lieu: toquesLergue,
      personnes: 2,
      creneau: ilYaCinqJours,
      statut: "honoree",
      presenceLe: decaler(ilYaCinqJours, -5),
      reponduLe: decaler(ilYaCinqJours, -44 * 60),
      code: "5530",
      visiteId: 9201,
    }),
    creerReservationExemple({ id: 9107, lieu: paddleFlamants, personnes: 1, creneau: ilYaNeufJours, statut: "absent", reponduLe: decaler(ilYaNeufJours, -20 * 60) }),
    creerReservationExemple({ id: 9108, lieu: nonnaLia, personnes: 5, creneau: ilYaDouzeJours, statut: "annulee", tardive: true, reponduLe: decaler(ilYaDouzeJours, -30 * 60) }),
    creerReservationExemple({ id: 9109, lieu: gadoue, personnes: 2, creneau: ilYaVingtJours, statut: "expiree" }),
    creerReservationExemple({ id: 9110, lieu: cleRuelles, personnes: 4, creneau: ilYaVingtSixJours, statut: "honoree", reponduLe: decaler(ilYaVingtSixJours, -26 * 60), code: "3362" }),
  ];
}
