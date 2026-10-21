import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { createElement, useEffect, useSyncExternalStore } from "react";
import { creerRacine } from "react-dom/client";
import { AppState } from "react-native";

import { changer, ecouter, lire, monde } from "../annonces-app/doublures/monde.mjs";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { utiliserPropositionVersion } from "~/hooks/utiliser-proposition-version";
import { lireFenetreDouce, prendreFenetreDouce, rendreFenetreDouce } from "~/services/fenetre-douce-ouverte";
import { poserFeuilleOuverte } from "~/services/feuilles-ouvertes";
import { noterNotificationOuverte } from "~/services/notification-ouverte";

const CLE = "sosmiam.version-app-deja-proposee";
const PROFIL = { prenom: "Léa", ville: "Montpellier", dateNaissance: "1990-01-01" };
const AVANT_MS = 1_300;
const APRES_MS = 1_800;

const pause = (ms) => new Promise((fin) => setTimeout(fin, ms));
const vraiMaintenant = Date.now.bind(Date);
let avance = 0;
Date.now = () => vraiMaintenant() + avance;

let majeure = 10;
let racine = null;
let erreursNonAttrapees = [];
const surErreur = (erreur) => erreursNonAttrapees.push(erreur);

const nouvelle = (version) => ({ etat: "nouvelle-version", version });
const lireEtatVersion = () => lire().etatVersion;

function Sonde() {
  const etatVersion = useSyncExternalStore(ecouter, lireEtatVersion, lireEtatVersion);
  const proposition = utiliserPropositionVersion(etatVersion);
  const visible = proposition.ouverte && proposition.version !== null;
  utiliserInscriptionFeuille(visible, proposition.fermer);
  useEffect(() => {
    monde.proposition = proposition;
  });
  const { version, marquerMontree } = proposition;
  useEffect(() => {
    if (!visible) return;
    monde.ouvertures.push(version);
    if (!monde.affichageRefuse) marquerMontree();
  }, [visible, version, marquerMontree]);
  return null;
}

const ouverte = () => (monde.proposition?.ouverte ? monde.proposition.version : null);

function monter() {
  racine = creerRacine();
  racine.render(createElement(Sonde));
}

function demarrer(etatVersion, etat = {}) {
  changer({ chemin: "/", sessionPrete: true, profil: PROFIL, invite: false, etatVersion, ...etat });
  monter();
}

async function relancer() {
  racine?.unmount();
  await pause(20);
  monter();
}

const prochaine = () => `${++majeure}.0.0`;

beforeEach(() => {
  avance += 60_000;
  erreursNonAttrapees = [];
  Object.assign(monde, { ouvertures: [], pousses: [], proposition: null, affichageRefuse: false });
  AppState.currentState = "active";
  process.on("uncaughtException", surErreur);
  process.on("unhandledRejection", surErreur);
});

afterEach(async () => {
  racine?.unmount();
  racine = null;
  await pause(20);
  process.off("uncaughtException", surErreur);
  process.off("unhandledRejection", surErreur);
  assert.equal(lireFenetreDouce(), null, "la place des fenêtres douces est rendue");
  assert.deepEqual(erreursNonAttrapees, []);
});

test("nouvelle version sur un onglet : proposée après un temps de calme, notée sur le téléphone, une seule fois", async () => {
  const version = prochaine();
  demarrer(nouvelle(version));
  await pause(AVANT_MS);
  assert.equal(ouverte(), null, "rien avant le temps de calme");
  await pause(APRES_MS - AVANT_MS);
  assert.equal(ouverte(), version);
  assert.equal(lireFenetreDouce(), "nouvelle-version");
  assert.equal(globalThis.__magasin?.get(CLE), version);
  monde.proposition.fermer();
  await pause(50);
  assert.equal(lireFenetreDouce(), null);
  await pause(2_500);
  assert.equal(ouverte(), null, "« Plus tard » : elle ne revient pas");
  assert.deepEqual(monde.ouvertures, [version]);
});

test("nouveau lancement : la version déjà proposée ne revient pas, une plus récente si", async () => {
  const version = prochaine();
  demarrer(nouvelle(version));
  await pause(APRES_MS);
  monde.proposition.fermer();
  await relancer();
  await pause(APRES_MS + 500);
  assert.equal(ouverte(), null);
  const suivante = prochaine();
  changer({ etatVersion: nouvelle(suivante) });
  await pause(APRES_MS);
  assert.equal(ouverte(), suivante);
  assert.deepEqual(monde.ouvertures, [version, suivante]);
  monde.proposition.fermer();
});

test("une version plus ancienne que celle déjà proposée ne revient pas", async () => {
  const version = prochaine();
  demarrer(nouvelle(version));
  await pause(APRES_MS);
  monde.proposition.fermer();
  changer({ etatVersion: nouvelle(`${majeure - 1}.5.0`) });
  await pause(APRES_MS + 300);
  assert.equal(ouverte(), null);
});

for (const [nom, etat] of [
  ["l'accueil (sans profil)", { chemin: "/bienvenue", profil: null }],
  ["l'inscription", { chemin: "/fais-connaissance", profil: null }],
  ["une fiche de lieu", { chemin: "/lieu/18" }],
  ["le mode pro", { chemin: "/pro/comptoir" }],
  ["Miam Safe", { chemin: "/miam-safe/comptoir" }],
  ["une session pas encore prête", { sessionPrete: false }],
]) {
  test(`jamais sur ${nom}`, async () => {
    demarrer(nouvelle(prochaine()), etat);
    await pause(APRES_MS + 300);
    assert.equal(ouverte(), null);
  });
}

test("visite sans compte, sur un onglet : proposée aussi", async () => {
  const version = prochaine();
  demarrer(nouvelle(version), { profil: null, invite: true });
  await pause(APRES_MS);
  assert.equal(ouverte(), version);
  monde.proposition.fermer();
});

test("à jour ou obligatoire : rien", async () => {
  demarrer({ etat: "a-jour" });
  await pause(APRES_MS);
  assert.equal(ouverte(), null);
  changer({ etatVersion: { etat: "obligatoire" } });
  await pause(APRES_MS);
  assert.equal(ouverte(), null);
});

test("une annonce du logiciel est à l'écran : la proposition attend sa fermeture", async () => {
  const version = prochaine();
  assert.equal(prendreFenetreDouce("annonce-app"), true);
  demarrer(nouvelle(version));
  await pause(APRES_MS + 700);
  assert.equal(ouverte(), null);
  rendreFenetreDouce("annonce-app");
  await pause(AVANT_MS);
  assert.equal(ouverte(), null, "encore un temps de calme après l'annonce");
  await pause(APRES_MS - AVANT_MS);
  assert.equal(ouverte(), version);
  assert.equal(prendreFenetreDouce("annonce-app"), false, "pendant ce temps, l'annonce attend");
  monde.proposition.fermer();
});

test("feuille inscrite ouverte : attend ; une fois fermée, la proposition vient", async () => {
  const version = prochaine();
  const oublierFeuille = poserFeuilleOuverte(() => {});
  demarrer(nouvelle(version));
  await pause(APRES_MS + 400);
  assert.equal(ouverte(), null);
  oublierFeuille();
  await pause(APRES_MS);
  assert.equal(ouverte(), version);
  monde.proposition.fermer();
});

test("notification touchée juste avant : rien pendant 10 s", async () => {
  noterNotificationOuverte();
  demarrer(nouvelle(prochaine()));
  await pause(3_000);
  assert.equal(ouverte(), null);
});

test("notification touchée il y a 8,5 s : la proposition attend la fin des 10 s, puis vient", async () => {
  const version = prochaine();
  noterNotificationOuverte();
  avance += 8_500;
  demarrer(nouvelle(version));
  await pause(AVANT_MS);
  assert.equal(ouverte(), null);
  await pause(APRES_MS - AVANT_MS);
  assert.equal(ouverte(), version);
  monde.proposition.fermer();
});

test("l'écran quitte les onglets pendant qu'elle est ouverte : elle se ferme et ne revient pas", async () => {
  const version = prochaine();
  demarrer(nouvelle(version));
  await pause(APRES_MS);
  assert.equal(ouverte(), version);
  changer({ chemin: "/lieu/18" });
  await pause(50);
  assert.equal(ouverte(), null);
  changer({ chemin: "/" });
  await pause(APRES_MS + 300);
  assert.equal(ouverte(), null);
});

test("fenêtre jamais montrée : se referme sans être notée, sans nouvel essai avant le prochain lancement", async () => {
  const version = prochaine();
  monde.affichageRefuse = true;
  demarrer(nouvelle(version));
  await pause(APRES_MS);
  assert.equal(ouverte(), version);
  await pause(1_700);
  assert.equal(ouverte(), null);
  assert.notEqual(globalThis.__magasin?.get(CLE), version);
  await pause(APRES_MS + 300);
  assert.deepEqual(monde.ouvertures, [version]);
  monde.affichageRefuse = false;
  await relancer();
  await pause(APRES_MS);
  assert.equal(ouverte(), version);
  monde.proposition.fermer();
});
