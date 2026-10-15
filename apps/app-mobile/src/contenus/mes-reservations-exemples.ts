import { calculerInstantParis } from "@sos-miam/commun/fonctions/temps/calculer-instant-paris";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import { decalerJour } from "@sos-miam/commun/fonctions/temps/decaler-jour";

import type { ReservationDemo } from "~/services/demo/types-demo";

type MaReservationExemple = Omit<ReservationDemo, "id" | "client">;

type ChampsExemple = Pick<MaReservationExemple, "lieuId" | "personnes" | "creneau" | "statut"> & Partial<MaReservationExemple>;

const MINUTE = 60_000;
const DEMI_HEURE = 30 * MINUTE;

const LIEUX = { nonnaLia: 0, verreTordu: 5, pagaiesLez: 6, cleRuelles: 7, gadoue: 8, tiellePepita: 9, paddleFlamants: 12, cabaneEmile: 13, toquesLergue: 16 } as const;

function poserDansJours(maintenantMs: number, jours: number, heures: number, minutes = 0): string {
  const heure = `${String(heures).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return new Date(calculerInstantParis(decalerJour(calculerJourParis(maintenantMs), jours), heure)).toISOString();
}

const poserProchaineDemiHeure = (maintenantMs: number) => new Date(Math.ceil((maintenantMs + 10 * MINUTE) / DEMI_HEURE) * DEMI_HEURE).toISOString();

const decaler = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * MINUTE).toISOString();

function creerExemple(champs: ChampsExemple): MaReservationExemple {
  return {
    message: null,
    motifRefus: null,
    tardive: false,
    creeLe: decaler(champs.creneau, -2 * 24 * 60),
    reponduLe: null,
    presenceLe: null,
    code: null,
    visiteId: null,
    ...champs,
  };
}

export function creerMesReservationsExemples(maintenantMs: number): MaReservationExemple[] {
  const ceSoir = poserProchaineDemiHeure(maintenantMs);
  const dansDeuxJours = poserDansJours(maintenantMs, 2, 20, 30);
  const dansTroisJours = poserDansJours(maintenantMs, 3, 12, 30);
  const dansQuatreJours = poserDansJours(maintenantMs, 4, 10);
  const ilYaTroisJours = poserDansJours(maintenantMs, -3, 21);
  const ilYaCinqJours = poserDansJours(maintenantMs, -5, 20);
  const ilYaNeufJours = poserDansJours(maintenantMs, -9, 10, 30);
  const ilYaDouzeJours = poserDansJours(maintenantMs, -12, 13);
  const ilYaVingtJours = poserDansJours(maintenantMs, -20, 15);
  const ilYaVingtSixJours = poserDansJours(maintenantMs, -26, 18);

  return [
    creerExemple({
      lieuId: LIEUX.nonnaLia,
      personnes: 2,
      creneau: ceSoir,
      statut: "acceptee",
      message: "On fête les 30 ans de Léa, une bougie sur le tiramisu ce serait le rêve !",
      creeLe: decaler(ceSoir, -26 * 60),
      reponduLe: decaler(ceSoir, -25 * 60),
      code: "4821",
    }),
    creerExemple({ lieuId: LIEUX.cabaneEmile, personnes: 4, creneau: dansTroisJours, statut: "demandee", creeLe: new Date(maintenantMs - 12 * MINUTE).toISOString() }),
    creerExemple({ lieuId: LIEUX.tiellePepita, personnes: 6, creneau: dansDeuxJours, statut: "refusee", motifRefus: "complet", reponduLe: decaler(dansDeuxJours, -40 * 60) }),
    creerExemple({ lieuId: LIEUX.pagaiesLez, personnes: 3, creneau: dansQuatreJours, statut: "annulee", motifRefus: "ferme", reponduLe: decaler(dansQuatreJours, -30 * 60) }),
    creerExemple({
      lieuId: LIEUX.verreTordu,
      personnes: 3,
      creneau: ilYaTroisJours,
      statut: "acceptee",
      reponduLe: decaler(ilYaTroisJours, -20 * 60),
      presenceLe: decaler(ilYaTroisJours, -4),
      code: "6094",
    }),
    creerExemple({
      lieuId: LIEUX.toquesLergue,
      personnes: 2,
      creneau: ilYaCinqJours,
      statut: "honoree",
      presenceLe: decaler(ilYaCinqJours, -5),
      reponduLe: decaler(ilYaCinqJours, -44 * 60),
      code: "5530",
    }),
    creerExemple({ lieuId: LIEUX.paddleFlamants, personnes: 1, creneau: ilYaNeufJours, statut: "absent", reponduLe: decaler(ilYaNeufJours, -20 * 60) }),
    creerExemple({ lieuId: LIEUX.nonnaLia, personnes: 5, creneau: ilYaDouzeJours, statut: "annulee", tardive: true, reponduLe: decaler(ilYaDouzeJours, -30 * 60) }),
    creerExemple({ lieuId: LIEUX.gadoue, personnes: 2, creneau: ilYaVingtJours, statut: "expiree" }),
    creerExemple({ lieuId: LIEUX.cleRuelles, personnes: 4, creneau: ilYaVingtSixJours, statut: "honoree", reponduLe: decaler(ilYaVingtSixJours, -26 * 60), code: "3362" }),
  ];
}
