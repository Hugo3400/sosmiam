import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { createElement, useEffect } from "react";
import { creerRacine } from "react-dom/client";
import { AppState } from "react-native";

import { changerProfil, monde } from "./doublures/monde.mjs";
import { FournisseurPositionActuelle } from "~/composants/explorer/FournisseurPositionActuelle";
import { utiliserEffacementLocal } from "~/hooks/utiliser-effacement-local";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";

const HUGO = { prenom: "Hugo", dateNaissance: "1995-01-01", ville: "Marseille", envies: {}, creeLe: "2026-09-01T10:00:00.000Z" };
const LEA = { prenom: "Léa", dateNaissance: "1992-04-02", ville: "Lyon", envies: {}, creeLe: "2026-10-02T09:00:00.000Z" };
const ICI = { latitude: 43.2965, longitude: 5.3698 };

const pause = (ms) => new Promise((fin) => setTimeout(fin, ms));
const vraiMaintenant = Date.now.bind(Date);
let avance = 0;
Date.now = () => vraiMaintenant() + avance;
let racine = null;

function Sonde() {
  const position = utiliserPositionActuelle();
  const effacement = utiliserEffacementLocal();
  useEffect(() => {
    monde.position = position;
    monde.effacement = effacement;
  });
  return null;
}

async function monter(profil = HUGO) {
  racine = creerRacine();
  monde.rendre = () => racine.render(createElement(FournisseurPositionActuelle, null, createElement(Sonde)));
  changerProfil(profil);
  await pause(30);
}

async function trouverPosition() {
  const lecture = await monde.position.chercher();
  await pause(30);
  assert.deepEqual(lecture?.position, ICI);
  assert.deepEqual(monde.position.position, ICI);
}

async function absence(minutes) {
  AppState.changerPourEssai("inactive");
  AppState.changerPourEssai("background");
  await pause(10);
  avance += minutes * 60_000;
  AppState.changerPourEssai("active");
  await pause(30);
}

const laisserReactRendre = async () => {
  for (let tour = 0; tour < 6; tour++) await new Promise((fin) => setImmediate(fin));
};

beforeEach(() => {
  Object.assign(monde, { lectures: [], appelsLecture: 0, effacements: [], position: null, effacement: null, attenteEffacement: 0, zonesOubliees: 0 });
  AppState.currentState = "active";
});

afterEach(async () => {
  monde.rendre = null;
  racine?.unmount();
  racine = null;
  await pause(20);
});

test("se déconnecter ou « Effacer mes données » oublie la position tout de suite, avant même la fin de l'effacement", async () => {
  await monter();
  await trouverPosition();
  monde.attenteEffacement = 40;
  const effacement = monde.effacement.toutEffacer();
  await pause(60);
  assert.equal(monde.effacements.includes("profil"), false, "l'effacement est encore en cours");
  assert.equal(monde.position.position, null, "position encore là pendant l'effacement");
  assert.equal(await effacement, true);
  await pause(30);
  assert.equal(monde.position.position, null);
  assert.ok(monde.effacements.includes("profil"));
});

test("une session perdue ou un autre compte : la position d'avant n'est jamais reprise", async () => {
  await monter();
  await trouverPosition();
  changerProfil(null);
  await pause(30);
  assert.equal(monde.position.position, null, "visite sans compte après la déconnexion");
  changerProfil(HUGO);
  await pause(30);
  assert.equal(monde.position.position, null, "le même compte qui revient ne retrouve rien");
  await trouverPosition();
  changerProfil(LEA);
  await pause(30);
  assert.equal(monde.position.position, null, "un autre compte sur le même téléphone");
});

test("une position qui arrive après la déconnexion n'est pas gardée", async () => {
  await monter();
  monde.lectures.push({ attente: 120, lecture: { position: ICI, approximative: false } });
  const enCours = monde.position.chercher();
  await pause(20);
  await monde.effacement.toutEffacer();
  assert.equal(await enCours, null);
  await pause(30);
  assert.equal(monde.position.position, null);
  assert.equal(monde.position.recherche, false);
});

test("plus de 5 minutes hors de l'app : oubliée, annoncée quelques secondes seulement", async () => {
  await monter();
  await trouverPosition();
  await absence(3);
  assert.deepEqual(monde.position.position, ICI, "3 minutes : toujours là");
  await absence(6);
  assert.equal(monde.position.position, null);
  const oubli = monde.position.oubliApresAbsence;
  assert.ok(typeof oubli === "number" && Math.abs(oubli - Date.now()) < 1_000);
  await pause(8_200);
  assert.equal(monde.position.oubliApresAbsence, null, "l'annonce ne ressort pas des heures après");
  await absence(10);
  assert.equal(monde.position.oubliApresAbsence, null, "rien à oublier : rien à annoncer");
});

test("se déconnecter avec un serveur lent : la position est oubliée avant même l'appel au serveur, puis tout s'efface", async () => {
  await monter();
  await trouverPosition();
  let pendantLAppel = "pas appelé";
  const effacement = monde.effacement.toutEffacer(async () => {
    await pause(40);
    pendantLAppel = monde.position.position;
    await pause(200);
    return true;
  });
  await pause(120);
  assert.equal(pendantLAppel, null, "position encore tenue pendant l'appel au serveur");
  assert.equal(monde.position.position, null);
  assert.deepEqual(monde.effacements, [], "rien d'effacé avant la fin de la fermeture");
  assert.equal(await effacement, true);
  assert.ok(monde.effacements.includes("profil"));
});

test("« Me déconnecter partout » refusé par le serveur : la position est oubliée quand même, rien d'autre n'est effacé", async () => {
  await monter();
  await trouverPosition();
  assert.equal(await monde.effacement.toutEffacer(async () => false), false);
  await pause(30);
  assert.equal(monde.position.position, null);
  assert.deepEqual(monde.effacements, []);
});

test("une lecture lancée sous un compte, arrivée après l'ouverture d'un autre compte : jamais montrée à l'autre", async () => {
  await monter(HUGO);
  monde.lectures.push({ attente: 120, lecture: { position: ICI, approximative: false } });
  const enCours = monde.position.chercher();
  await pause(20);
  changerProfil(LEA);
  await pause(20);
  await enCours;
  await pause(30);
  assert.equal(monde.position.position, null, "la position lue pour Hugo s'affiche chez Léa");
});

test("plus de 5 minutes en arrière-plan : la position est oubliée sans attendre le retour, et l'oubli est annoncé au retour", async (t) => {
  await monter();
  await trouverPosition();
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    AppState.changerPourEssai("background");
    t.mock.timers.tick(4 * 60_000);
    await laisserReactRendre();
    assert.deepEqual(monde.position.position, ICI, "4 minutes : toujours là");
    t.mock.timers.tick(61_000);
    await laisserReactRendre();
    assert.equal(monde.position.position, null, "toujours tenue après 5 minutes en arrière-plan");
    avance += 6 * 60_000;
    AppState.changerPourEssai("active");
    await laisserReactRendre();
    assert.ok(typeof monde.position.oubliApresAbsence === "number", "rien n'annonce l'oubli au retour");
  } finally {
    t.mock.timers.reset();
  }
});

test("revenir avant 5 minutes garde la position, même si l'app est repartie en arrière-plan entre-temps", async (t) => {
  await monter();
  await trouverPosition();
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    AppState.changerPourEssai("background");
    t.mock.timers.tick(3 * 60_000);
    AppState.changerPourEssai("active");
    AppState.changerPourEssai("background");
    t.mock.timers.tick(3 * 60_000);
    AppState.changerPourEssai("active");
    await laisserReactRendre();
    assert.deepEqual(monde.position.position, ICI);
    assert.equal(monde.position.oubliApresAbsence, null);
  } finally {
    t.mock.timers.reset();
  }
});

test("l'oubli n'est annoncé qu'une fois : l'écran qui l'a dit l'éteint pour les autres", async () => {
  await monter();
  await trouverPosition();
  await absence(6);
  const oubli = monde.position.oubliApresAbsence;
  assert.ok(typeof oubli === "number");
  monde.position.marquerOubliDit(oubli - 1);
  await pause(20);
  assert.equal(monde.position.oubliApresAbsence, oubli, "un autre oubli ne l'éteint pas");
  monde.position.marquerOubliDit(oubli);
  await pause(20);
  assert.equal(monde.position.oubliApresAbsence, null);
});

test("la position oubliée emporte les zones demandées depuis elle", async () => {
  await monter();
  const auDepart = monde.zonesOubliees;
  await trouverPosition();
  assert.equal(monde.zonesOubliees, auDepart, "trouver sa position n'oublie rien");
  monde.position.oublier();
  await pause(30);
  assert.equal(monde.zonesOubliees, auDepart + 1);
  await trouverPosition();
  await monde.effacement.toutEffacer();
  await pause(30);
  assert.equal(monde.zonesOubliees, auDepart + 2, "la déconnexion oublie aussi les zones");
});
