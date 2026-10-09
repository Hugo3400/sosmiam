// Tests des statistiques d'un lieu pour son équipe (GET /pro/comptoir/lieux/:id/statistiques) : rangement par semaine de
// Paris (vues, rescousses, visites validées, nouveaux clients), nombre de semaines, rôles.
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import { listerPeriodes } from "../src/fonctions/dates/lister-periodes.ts";
import { calculerStatistiquesSemaines } from "../src/fonctions/statistiques/calculer-statistiques-semaines.ts";
import { lireNombreSemaines } from "../src/fonctions/statistiques/lire-nombre-semaines.ts";
import { creerBancStatistiques, DEBUT_BANC } from "./outils/creer-banc-statistiques.ts";

let b: Awaited<ReturnType<typeof creerBancStatistiques>>;
before(async () => { b = await creerBancStatistiques(); });
after(() => b.fermer());
beforeEach(() => b.vider());

const vide = (semaine: string, debut: string) => ({ semaine, debut, vues: 0, rescousses: 0, visitesValidees: 0, nouveauxClients: 0 });
const lire = (jeton: string, requete = "") => b.demander("GET", `/pro/comptoir/lieux/1/statistiques${requete}`, { jeton });

test("calculerStatistiquesSemaines : chaque chiffre dans sa semaine de Paris, la plus récente d'abord", () => {
  const periodes = listerPeriodes("semaine", 3, new Date(DEBUT_BANC));
  const semaines = calculerStatistiquesSemaines(periodes, {
    // Le dimanche 20 septembre est dans la semaine 38, hors des trois semaines : ignoré
    vues: [{ jour: "2026-10-05", nombre: 4 }, { jour: "2026-10-04", nombre: 2 }, { jour: "2026-09-27", nombre: 1 }, { jour: "2026-09-20", nombre: 50 }],
    rescousses: [{ semaine: "2026-S41", nombre: 3 }, { semaine: "2026-S38", nombre: 9 }],
    // Dimanche 4 octobre, 23 h 30 à Paris (semaine 40) ; lundi 5 octobre, 0 h 30 à Paris (semaine 41)
    validations: [new Date("2026-10-04T21:30:00Z"), new Date("2026-10-04T22:30:00Z")],
    premieresValidations: [new Date("2026-10-04T22:30:00Z")],
  });
  assert.deepEqual(semaines, [
    { semaine: "2026-S41", debut: "2026-10-05", vues: 4, rescousses: 3, visitesValidees: 1, nouveauxClients: 1 },
    { semaine: "2026-S40", debut: "2026-09-28", vues: 2, rescousses: 0, visitesValidees: 1, nouveauxClients: 0 },
    { semaine: "2026-S39", debut: "2026-09-21", vues: 1, rescousses: 0, visitesValidees: 0, nouveauxClients: 0 },
  ]);
});

test("lireNombreSemaines : 8 sans rien, de 1 à 26", () => {
  assert.equal(lireNombreSemaines(undefined), 8);
  for (const brut of ["1", "01", "12", "26"]) assert.equal(lireNombreSemaines(brut), Number(brut), brut);
  for (const brut of ["0", "27", "99", "007", "abc", "2.5", "-1", "", " 3", ["3", "4"], 3]) assert.equal(lireNombreSemaines(brut), null, String(brut));
});

test("le gérant et l'équipe voient leurs semaines : vues, rescousses, visites validées, nouveaux clients", async () => {
  const gerant = await b.creerCompte({ prenom: "Max" });
  b.rattacher(gerant.id, 1, "gerant");
  const serveur = await b.creerCompte({ prenom: "Nina" });
  b.rattacher(serveur.id, 1, "equipe");

  // Vues : trois visiteurs aujourd'hui (l'un revient), d'autres jours déjà comptés, et un autre lieu
  for (const ip of ["203.0.113.1", "203.0.113.2", "203.0.113.2", "203.0.113.3"]) await b.demander("POST", "/app/lieux/1/vue", { ip });
  b.vues.vues.push({ lieuId: 1, jour: "2026-09-30", nombre: 12 }, { lieuId: 1, jour: "2026-09-20", nombre: 7 }, { lieuId: 2, jour: "2026-10-06", nombre: 99 });
  // Rescousses : deux cette semaine, une la semaine d'avant, une trop ancienne, une pour un autre lieu
  b.statistiques.rescousses.push(
    { compteId: 101, lieuId: 1, semaine: "2026-S41" }, { compteId: 102, lieuId: 1, semaine: "2026-S41" },
    { compteId: 101, lieuId: 1, semaine: "2026-S40" }, { compteId: 103, lieuId: 1, semaine: "2026-S38" }, { compteId: 104, lieuId: 2, semaine: "2026-S41" },
  );
  b.statistiques.visites.push(
    // 101 venait déjà avant : sa visite de cette semaine compte, mais ce n'est pas un nouveau client
    { compteId: 101, lieuId: 1, statut: "validee", valideLe: new Date("2026-09-15T12:00:00Z") },
    { compteId: 101, lieuId: 1, statut: "validee", valideLe: new Date("2026-10-06T18:00:00Z") },
    // 102 : nouveau la semaine dernière, revenu cette semaine
    { compteId: 102, lieuId: 1, statut: "validee", valideLe: new Date("2026-09-29T19:00:00Z") },
    { compteId: 102, lieuId: 1, statut: "validee", valideLe: new Date("2026-10-07T19:00:00Z") },
    // 103 : une validation annulée la semaine dernière ne compte pas ; nouveau cette semaine
    { compteId: 103, lieuId: 1, statut: "annulee", valideLe: new Date("2026-09-30T12:00:00Z") },
    { compteId: 103, lieuId: 1, statut: "validee", valideLe: new Date("2026-10-08T12:00:00Z") },
    // 104 : ailleurs, ou pas encore validée
    { compteId: 104, lieuId: 2, statut: "validee", valideLe: new Date("2026-10-06T12:00:00Z") },
    { compteId: 104, lieuId: 1, statut: "demandee", valideLe: null },
    // 105 : dimanche 4 octobre, 23 h 30 à Paris : encore la semaine dernière
    { compteId: 105, lieuId: 1, statut: "validee", valideLe: new Date("2026-10-04T21:30:00Z") },
  );

  const attendu = [
    { semaine: "2026-S41", debut: "2026-10-05", vues: 3, rescousses: 2, visitesValidees: 3, nouveauxClients: 1 },
    { semaine: "2026-S40", debut: "2026-09-28", vues: 12, rescousses: 1, visitesValidees: 2, nouveauxClients: 2 },
    vide("2026-S39", "2026-09-21"),
  ];
  const r = await lire(gerant.jeton, "?semaines=3");
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.deepEqual(r.corps, { ok: true, semaines: attendu });
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual((await lire(serveur.jeton, "?semaines=3")).corps, { ok: true, semaines: attendu });
});

test("8 semaines par défaut, de 1 à 26, sinon 400 champ-invalide", async () => {
  const gerant = await b.creerCompte();
  b.rattacher(gerant.id, 1);
  const parDefaut = (await lire(gerant.jeton)).corps!.semaines;
  assert.equal(parDefaut.length, 8);
  assert.deepEqual([parDefaut[0], parDefaut[7]], [vide("2026-S41", "2026-10-05"), vide("2026-S34", "2026-08-17")]);
  const semestre = (await lire(gerant.jeton, "?semaines=26")).corps!.semaines;
  assert.deepEqual([semestre.length, semestre[25]], [26, vide("2026-S16", "2026-04-13")]);
  assert.deepEqual((await lire(gerant.jeton, "?semaines=1")).corps!.semaines, [vide("2026-S41", "2026-10-05")]);
  for (const requete of ["?semaines=0", "?semaines=27", "?semaines=abc", "?semaines=2.5", "?semaines=", "?semaines=3&semaines=4"]) {
    const r = await lire(gerant.jeton, requete);
    assert.deepEqual([r.statut, r.corps], [400, { ok: false, erreur: "champ-invalide", champ: "semaines" }], requete);
  }
});

test("la semaine change le lundi à minuit, heure de Paris", async () => {
  const gerant = await b.creerCompte();
  b.rattacher(gerant.id, 1);
  b.statistiques.visites.push({ compteId: 101, lieuId: 1, statut: "validee", valideLe: new Date("2026-10-11T21:00:00Z") });
  // Dimanche 11 octobre, 23 h 59 à Paris
  b.banc.horloge = Date.parse("2026-10-11T21:59:00Z");
  assert.deepEqual((await lire(gerant.jeton, "?semaines=1")).corps!.semaines, [{ ...vide("2026-S41", "2026-10-05"), visitesValidees: 1, nouveauxClients: 1 }]);
  // Lundi 12 octobre, minuit à Paris : une semaine neuve
  b.banc.horloge = Date.parse("2026-10-11T22:00:00Z");
  assert.deepEqual((await lire(gerant.jeton, "?semaines=2")).corps!.semaines, [
    vide("2026-S42", "2026-10-12"), { ...vide("2026-S41", "2026-10-05"), visitesValidees: 1, nouveauxClients: 1 },
  ]);
});

test("rôles : pas de l'équipe, mineur, autre lieu, sans session", async () => {
  const intrus = await b.creerCompte();
  const ailleurs = await b.creerCompte();
  b.rattacher(ailleurs.id, 2);
  // 16 ans : jamais de rôle pro sous 18 ans, même rattaché
  const mineur = await b.creerCompte({ naissance: "2010-05-01" });
  b.rattacher(mineur.id, 1, "equipe");
  for (const compte of [intrus, ailleurs, mineur]) {
    const r = await lire(compte.jeton, "?semaines=99");
    assert.deepEqual([r.statut, r.corps], [403, { ok: false, erreur: "role-requis" }]);
  }
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/999/statistiques", { jeton: ailleurs.jeton })).corps!.erreur, "role-requis");
  assert.deepEqual((await b.demander("GET", "/pro/comptoir/lieux/abc/statistiques", { jeton: ailleurs.jeton })).corps, { ok: false, erreur: "champ-invalide", champ: "id" });
  const sansSession = await b.demander("GET", "/pro/comptoir/lieux/1/statistiques");
  assert.deepEqual([sansSession.statut, sansSession.corps!.erreur], [401, "session-expiree"]);
  // Le gérant du lieu 2 voit le sien
  assert.equal((await b.demander("GET", "/pro/comptoir/lieux/2/statistiques", { jeton: ailleurs.jeton })).statut, 200);
});
