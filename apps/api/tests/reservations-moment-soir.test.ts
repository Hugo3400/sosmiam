import assert from "node:assert/strict";
import { test } from "node:test";

import { calculerDecalageParis } from "../../../packages/commun/src/fonctions/temps/calculer-decalage-paris.ts";
import { calculerJourParis } from "../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import { ecrireHeureReservation } from "../src/fonctions/reservations/ecrire-heure-reservation.ts";
import { ecrireMomentReservation } from "../src/fonctions/reservations/ecrire-moment-reservation.ts";

type Ecrire = (creneau: Date, maintenant: Date) => string;

const ETE = { jour: "2026-10-09", decalage: "+02:00" };
const HIVER = { jour: "2026-11-20", decalage: "+01:00" };
const aParis = (saison: { jour: string; decalage: string }, heure: string) => new Date(`${saison.jour}T${heure}:00${saison.decalage}`);

const ATTENDUS: [string, string, string][] = [
  ["12:00", "17:29", "aujourd'hui à 17h29"],
  ["12:00", "17:30", "aujourd'hui à 17h30"],
  ["17:30", "17:59", "aujourd'hui à 17h59"],
  ["17:30", "18:00", "ce soir à 18h"],
  ["17:30", "20:00", "ce soir à 20h"],
];

function trouverEcarts(ecrire: Ecrire): string[] {
  return [ETE, HIVER].flatMap((saison) => ATTENDUS.flatMap(([maintenant, creneau, attendu]) => {
    const lu = ecrire(aParis(saison, creneau), aParis(saison, maintenant));
    return lu === attendu ? [] : [`${saison.jour} ${creneau} : « ${lu} »`];
  }));
}

function creerMutant(soir: (creneau: Date) => boolean): Ecrire {
  return (creneau, maintenant) => {
    const heure = ecrireHeureReservation(creneau);
    if (calculerJourParis(creneau.getTime()) !== calculerJourParis(maintenant.getTime())) return `plus tard à ${heure}`;
    return `${soir(creneau) ? "ce soir" : "aujourd'hui"} à ${heure}`;
  };
}

const heuresParis = (creneau: Date) => new Date(creneau.getTime() + calculerDecalageParis(creneau.getTime()));

test("limite du soir : 17 h 30 à Paris, c'est encore « aujourd'hui » ; « ce soir » à partir de 18 h, été comme hiver", () => {
  assert.deepEqual(trouverEcarts(ecrireMomentReservation), []);
});

test("mutants de la limite du soir : chacun est vu par l'essai", () => {
  const mutants: [string, Ecrire][] = [
    ["soir dès 17 h", creerMutant((c) => heuresParis(c).getUTCHours() >= 17)],
    ["soir après 18 h seulement", creerMutant((c) => heuresParis(c).getUTCHours() > 18)],
    ["heure UTC au lieu de Paris", creerMutant((c) => c.getUTCHours() >= 18)],
    ["17 h 30 arrondi à 18 h", creerMutant((c) => Math.round(heuresParis(c).getUTCHours() + heuresParis(c).getUTCMinutes() / 60) >= 18)],
    ["soir dès 17 h 30", creerMutant((c) => heuresParis(c).getUTCHours() * 60 + heuresParis(c).getUTCMinutes() >= 17 * 60 + 30)],
  ];
  for (const [nom, mutant] of mutants) assert.notDeepEqual(trouverEcarts(mutant), [], nom);
});
