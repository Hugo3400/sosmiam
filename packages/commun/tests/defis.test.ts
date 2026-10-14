// Défis et badges automatiques : jours de Paris, état d'un défi, suite de semaines et moteur de mesure (compterMesureDefi).
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerEtatDefi } from "../src/fonctions/defis/calculer-etat-defi.ts";
import { calculerPlusLongueSuiteSemaines } from "../src/fonctions/defis/calculer-plus-longue-suite-semaines.ts";
import { compterMesureDefi } from "../src/fonctions/defis/compter-mesure-defi.ts";
import { calculerJourParis } from "../src/fonctions/temps/calculer-jour-paris.ts";
import { decalerJour } from "../src/fonctions/temps/decaler-jour.ts";
import type { FaitsDefi, VisiteDefi } from "../src/types/defi.ts";

const ms = (iso: string) => Date.parse(iso);
const TOUT = { debut: null, fin: null };
const faits = (f: Partial<FaitsDefi>): FaitsDefi => ({ rescousses: [], premiersSauvetages: [], visites: [], avis: [], ...f });
const visite = (iso: string, v: Partial<VisiteDefi> = {}): VisiteDefi => ({ le: ms(iso), lieuId: 1, typeLieu: "resto", ville: "Montpellier", pendantSos: false, ...v });

test("calculerJourParis : le jour qu'il est à Paris, été comme hiver, changement d'heure compris", () => {
  assert.equal(calculerJourParis(ms("2026-10-14T21:59:00Z")), "2026-10-14"); // 23 h 59 en heure d'été
  assert.equal(calculerJourParis(ms("2026-10-14T22:00:00Z")), "2026-10-15"); // minuit à Paris
  assert.equal(calculerJourParis(ms("2026-12-31T22:59:00Z")), "2026-12-31"); // 23 h 59 en heure d'hiver
  assert.equal(calculerJourParis(ms("2026-12-31T23:00:00Z")), "2027-01-01");
  // Nuit du 24 au 25 octobre 2026 : 2 h 59 (été) à 1 h UTC moins une minute, puis 2 h (hiver)
  assert.equal(calculerJourParis(ms("2026-10-24T22:30:00Z")), "2026-10-25");
  assert.equal(calculerJourParis(ms("2026-10-25T22:30:00Z")), "2026-10-25");
  assert.equal(calculerJourParis(ms("2026-10-25T23:00:00Z")), "2026-10-26");
});

test("decalerJour : jours du calendrier, mois, années et 29 février", () => {
  assert.equal(decalerJour("2026-10-31", 1), "2026-11-01");
  assert.equal(decalerJour("2026-01-01", -1), "2025-12-31");
  assert.equal(decalerJour("2028-02-28", 1), "2028-02-29");
  assert.equal(decalerJour("2026-11-30", 7), "2026-12-07");
  assert.equal(decalerJour("30/11/2026", 7), "");
});

test("calculerEtatDefi : à venir, en cours (dernier jour compris), terminé, réussi même fini", () => {
  const defi = { debut: "2026-10-14", fin: "2026-11-30" };
  assert.equal(calculerEtatDefi(defi, false, "2026-10-13"), "a-venir");
  assert.equal(calculerEtatDefi(defi, false, "2026-10-14"), "en-cours");
  assert.equal(calculerEtatDefi(defi, false, "2026-11-30"), "en-cours");
  assert.equal(calculerEtatDefi(defi, false, "2026-12-01"), "termine");
  assert.equal(calculerEtatDefi(defi, true, "2027-03-01"), "reussi");
  assert.equal(calculerEtatDefi({ debut: "2026-10-14", fin: null }, false, "2030-01-01"), "en-cours");
});

test("calculerPlusLongueSuiteSemaines : semaines du lundi au dimanche, une semaine vide coupe la suite", () => {
  assert.equal(calculerPlusLongueSuiteSemaines([]), 0);
  assert.equal(calculerPlusLongueSuiteSemaines(["2026-10-14"]), 1);
  // Deux jours de la même semaine (lundi 12 et dimanche 18 octobre) : une seule semaine
  assert.equal(calculerPlusLongueSuiteSemaines(["2026-10-12", "2026-10-18"]), 1);
  // Dimanche 18 puis lundi 19 : deux semaines d'affilée
  assert.equal(calculerPlusLongueSuiteSemaines(["2026-10-18", "2026-10-19"]), 2);
  // Une semaine sans visite (celle du 12 octobre) coupe la suite ; la plus longue gagne, dans n'importe quel ordre
  assert.equal(calculerPlusLongueSuiteSemaines(["2026-10-27", "2026-10-05", "2026-10-21", "2026-11-02", "2026-10-29"]), 3);
  // Changement d'année : semaine 53 de 2026 (lundi 28 décembre), puis semaines 1 et 2 de 2027
  assert.equal(calculerPlusLongueSuiteSemaines(["2026-12-30", "2027-01-05", "2027-01-12"]), 3);
  assert.equal(calculerPlusLongueSuiteSemaines(["n'importe quoi", "2026-10-14"]), 1);
});

test("mesure : rescousses, premiers sauvetages et avis, dans la période (jours de Paris compris)", () => {
  const f = faits({
    // 13 octobre 23 h 30 à Paris (hors période), 14 octobre 0 h 30 à Paris (dedans), 30 novembre 23 h (dedans), 1er décembre (hors)
    rescousses: [ms("2026-10-13T21:30:00Z"), ms("2026-10-13T22:30:00Z"), ms("2026-11-30T22:00:00Z"), ms("2026-11-30T23:00:00Z")],
    premiersSauvetages: [ms("2026-10-20T10:00:00Z")],
    avis: [{ le: ms("2026-10-15T10:00:00Z"), avecPhoto: true }, { le: ms("2026-10-16T10:00:00Z"), avecPhoto: false }],
  });
  const periode = { debut: "2026-10-14", fin: "2026-11-30" };
  assert.equal(compterMesureDefi(f, "rescousses", null, periode), 2);
  assert.equal(compterMesureDefi(f, "rescousses", null, TOUT), 4);
  assert.equal(compterMesureDefi(f, "rescousses", null, { debut: "2026-10-14", fin: null }), 3);
  assert.equal(compterMesureDefi(f, "premiers-sauvetages", null, periode), 1);
  assert.equal(compterMesureDefi(f, "avis", null, TOUT), 2);
  assert.equal(compterMesureDefi(f, "avis", { avecPhoto: true }, TOUT), 1);
  assert.equal(compterMesureDefi(faits({}), "visites", null, TOUT), 0);
});

test("mesure : « après 22 h » à l'heure de Paris, jusqu'à 5 h du matin, été comme hiver", () => {
  const f = faits({
    visites: [
      visite("2026-10-14T19:30:00Z"), // 21 h 30 (été) : non
      visite("2026-10-14T20:00:00Z"), // 22 h pile : oui
      visite("2026-10-14T22:30:00Z"), // 0 h 30 : oui
      visite("2026-10-15T02:59:00Z"), // 4 h 59 : oui
      visite("2026-10-15T03:00:00Z"), // 5 h : non
      visite("2026-12-01T20:30:00Z"), // 21 h 30 (hiver) : non
      visite("2026-12-01T21:30:00Z"), // 22 h 30 (hiver) : oui
    ],
  });
  assert.equal(compterMesureDefi(f, "visites", { apresHeure: 22 }, TOUT), 4);
  assert.equal(compterMesureDefi(f, "visites", null, TOUT), 7);
  // Un filtre qui n'est pas permis pour la mesure est ignoré (villes : types de lieu seulement)
  assert.equal(compterMesureDefi(f, "villes-differentes", { apresHeure: 22 }, TOUT), 1);
});

test("mesure : types de lieu, pendant un SOS, lieux et villes différents, semaines d'affilée", () => {
  const f = faits({
    visites: [
      visite("2026-10-14T10:00:00Z", { lieuId: 1, typeLieu: "patisserie", ville: "Montpellier", pendantSos: true }),
      visite("2026-10-15T10:00:00Z", { lieuId: 1, typeLieu: "patisserie", ville: "Montpellier" }),
      visite("2026-10-21T10:00:00Z", { lieuId: 2, typeLieu: "patisserie", ville: "montpellier " }),
      visite("2026-10-28T10:00:00Z", { lieuId: 3, typeLieu: "sortie", ville: "Sète", pendantSos: true }),
      visite("2026-11-11T10:00:00Z", { lieuId: 4, typeLieu: "resto", ville: "Lyon" }),
    ],
  });
  assert.equal(compterMesureDefi(f, "visites", { typesLieu: ["patisserie"] }, TOUT), 3);
  assert.equal(compterMesureDefi(f, "visites", { pendantSos: true }, TOUT), 2);
  assert.equal(compterMesureDefi(f, "lieux-differents", null, TOUT), 4);
  assert.equal(compterMesureDefi(f, "lieux-differents", { typesLieu: ["patisserie"] }, TOUT), 2);
  assert.equal(compterMesureDefi(f, "lieux-differents", { typesLieu: ["patisserie", "sortie"], pendantSos: true }, TOUT), 2);
  // « Montpellier » et « montpellier » : la même ville
  assert.equal(compterMesureDefi(f, "villes-differentes", null, TOUT), 3);
  // Semaines du 12, 19 et 26 octobre, rien la semaine du 2 novembre, puis celle du 9
  assert.equal(compterMesureDefi(f, "semaines-d-affilee", null, TOUT), 3);
  assert.equal(compterMesureDefi(f, "semaines-d-affilee", { typesLieu: ["patisserie"] }, TOUT), 2);
  assert.equal(compterMesureDefi(f, "semaines-d-affilee", null, { debut: "2026-10-20", fin: null }), 2);
});
