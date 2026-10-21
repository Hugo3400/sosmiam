import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { createElement, useEffect } from "react";
import { creerRacine } from "react-dom/client";
import { AppState } from "react-native";

import { changer, monde } from "./doublures/monde.mjs";
import { utiliserAnnonceApp } from "~/hooks/utiliser-annonce-app";
import { utiliserInscriptionFeuille } from "~/hooks/utiliser-inscription-feuille";
import { poserFeuilleOuverte } from "~/services/feuilles-ouvertes";
import { lireFenetreDouce, prendreFenetreDouce, rendreFenetreDouce } from "~/services/fenetre-douce-ouverte";
import { noterNotificationOuverte } from "~/services/notification-ouverte";

const CLE = "sosmiam.annonces-app-deja-vues";
const PROFIL = { prenom: "Léa", ville: "  Montpellier ", dateNaissance: "1990-01-01" };
const AVANT_AFFICHAGE_MS = 1_000;
const APRES_AFFICHAGE_MS = 2_000;

const pause = (ms) => new Promise((fin) => setTimeout(fin, ms));
const vraiMaintenant = Date.now.bind(Date);
let avance = 0;
Date.now = () => vraiMaintenant() + avance;

let base = 0;
let racine = null;
let erreursNonAttrapees = [];
const surErreur = (erreur) => erreursNonAttrapees.push(erreur);

const annonce = (id, plus = {}) => ({ id: id + base, titre: `Annonce ${id}`, texte: "Salut les Miamis !", emoji: null, bouton: null, fin: null, ...plus });

function creerService(reponses) {
  const appels = [];
  return {
    appels,
    lister(ville) {
      appels.push(ville);
      const reponse = typeof reponses === "function" ? reponses(appels.length) : reponses;
      if (reponse === "jette") throw new URIError("URI malformed");
      if (reponse === "rejette") return Promise.reject(new Error("hors ligne"));
      if (reponse === 404) return Promise.resolve({ ok: false, erreur: "erreur-serveur" });
      if (reponse?.delai) return new Promise((fin) => setTimeout(() => fin({ ok: true, annonces: reponse.annonces }), reponse.delai));
      if (Array.isArray(reponse)) return Promise.resolve({ ok: true, annonces: reponse });
      return Promise.resolve(reponse);
    },
  };
}

function Sonde() {
  const etat = utiliserAnnonceApp();
  const visible = etat.ouverte && etat.annonce !== null;
  utiliserInscriptionFeuille(visible, etat.fermer);
  useEffect(() => {
    monde.etatHook = etat;
  });
  const { annonce, marquerMontree } = etat;
  useEffect(() => {
    if (!visible) return;
    monde.ouvertures.push(annonce.id - base);
    if (!monde.affichageRefuse) marquerMontree();
  }, [visible, annonce, marquerMontree]);
  return null;
}

const ouverte = () => (monde.etatHook?.ouverte ? monde.etatHook.annonce.id - base : null);
const vuesDuTest = () => JSON.parse(globalThis.__magasin?.get(CLE) ?? "[]").filter((id) => id > base).map((id) => id - base);

function monter() {
  racine = creerRacine();
  racine.render(createElement(Sonde));
}

function demarrer(service, etat = {}) {
  monde.sansCompte = service;
  changer({ chemin: "/", sessionPrete: true, profil: PROFIL, invite: false, services: { source: "api", annoncesApp: service }, ...etat });
  monter();
}

async function absence(minutes) {
  AppState.changerPourEssai("inactive");
  AppState.changerPourEssai("background");
  await pause(20);
  avance += minutes * 60_000;
  AppState.changerPourEssai("active");
  await pause(20);
}

beforeEach(() => {
  base += 1_000;
  avance += 60_000;
  erreursNonAttrapees = [];
  Object.assign(monde, { ouvertures: [], pousses: [], etatHook: null, affichageRefuse: false });
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
});

test("au démarrage sur un onglet : une seule pop-up, la plus récente, ville du profil sans espaces, notée vue une fois montrée", async () => {
  const service = creerService([annonce(3), annonce(2)]);
  demarrer(service);
  await pause(AVANT_AFFICHAGE_MS);
  assert.equal(ouverte(), null, "rien avant le délai de calme");
  await pause(APRES_AFFICHAGE_MS - AVANT_AFFICHAGE_MS);
  assert.equal(ouverte(), 3);
  assert.deepEqual(service.appels, ["Montpellier"]);
  assert.deepEqual(vuesDuTest(), [3]);
  monde.etatHook.fermer();
  await pause(2_500);
  assert.equal(ouverte(), null, "pas de deuxième pop-up dans la même occasion");
  assert.deepEqual(monde.ouvertures, [3]);
  assert.equal(service.appels.length, 1);
});

for (const [chemin, profil] of [["/bienvenue", null], ["/miam-safe/comptoir", PROFIL], ["/pro/comptoir", PROFIL]]) {
  test(`jamais sur ${chemin} : aucune demande, rien d'affiché`, async () => {
    const service = creerService([annonce(1)]);
    demarrer(service, { chemin, profil });
    await pause(2_200);
    assert.equal(ouverte(), null);
    assert.equal(service.appels.length, 0);
  });
}

test("sans profil ni visite (en route vers l'accueil) : rien", async () => {
  const service = creerService([annonce(1)]);
  demarrer(service, { profil: null, invite: false });
  await pause(2_200);
  assert.equal(service.appels.length, 0);
});

test("visite sans compte : la demande part sans ville, par le service sans compte", async () => {
  const sansCompte = creerService([annonce(1)]);
  demarrer(sansCompte, { profil: null, invite: true, services: { source: "indisponible", annoncesApp: creerService([]) } });
  await pause(APRES_AFFICHAGE_MS);
  assert.deepEqual(sansCompte.appels, [null]);
  assert.equal(ouverte(), 1);
});

test("feuille inscrite ouverte (« Crée ton compte », menus…) : attend ; une fois fermée, la pop-up vient", async () => {
  const service = creerService([annonce(1)]);
  const oublierFeuille = poserFeuilleOuverte(() => {});
  demarrer(service);
  await pause(2_200);
  assert.equal(service.appels.length, 0);
  assert.equal(ouverte(), null);
  oublierFeuille();
  await pause(APRES_AFFICHAGE_MS);
  assert.equal(ouverte(), 1);
});

test("app inactive (alerte du système) entre la réponse et l'affichage : attend le retour au premier plan", async () => {
  const service = creerService([annonce(1)]);
  demarrer(service);
  await pause(1_300);
  AppState.changerPourEssai("inactive");
  await pause(800);
  assert.equal(ouverte(), null);
  AppState.changerPourEssai("active");
  await pause(700);
  assert.equal(ouverte(), 1);
});

test("retour avant 30 min : aucune demande ; après 30 min : une demande, la vue ne revient pas, la nouvelle s'affiche", async () => {
  let liste = [annonce(1)];
  const service = creerService(() => liste);
  demarrer(service);
  await pause(APRES_AFFICHAGE_MS);
  assert.equal(ouverte(), 1);
  monde.etatHook.fermer();
  await absence(29.9);
  await pause(1_800);
  assert.equal(service.appels.length, 1, "29,9 min : aucune demande");
  await absence(30);
  await pause(1_800);
  assert.equal(service.appels.length, 2, "30 min : une demande");
  assert.equal(ouverte(), null, "la 1 est vue : elle ne revient pas");
  liste = [annonce(2), annonce(1)];
  await absence(45);
  await pause(APRES_AFFICHAGE_MS);
  assert.equal(service.appels.length, 3);
  assert.equal(ouverte(), 2);
  assert.deepEqual(monde.ouvertures, [1, 2]);
});

for (const [nom, reponse] of [["404", 404], ["hors ligne", "rejette"], ["service qui jette tout de suite", "jette"], ["réponse sans liste", { ok: true }]]) {
  test(`${nom} : rien, aucune erreur non attrapée, pas de nouvel essai dans la même occasion`, async () => {
    const service = creerService(() => reponse);
    demarrer(service);
    await pause(APRES_AFFICHAGE_MS);
    changer({ chemin: "/explorer" });
    await pause(1_800);
    assert.equal(ouverte(), null);
    assert.equal(service.appels.length, 1);
    assert.deepEqual(erreursNonAttrapees, []);
  });
}

test("ouverte depuis une notification : l'occasion est sautée, la pop-up attend le prochain retour", async () => {
  const service = creerService([annonce(1)]);
  noterNotificationOuverte();
  demarrer(service);
  await pause(2_200);
  assert.equal(service.appels.length, 0);
  assert.equal(ouverte(), null);
  await absence(31);
  await pause(APRES_AFFICHAGE_MS);
  assert.equal(service.appels.length, 1);
  assert.equal(ouverte(), 1);
});

test("notification touchée pendant que la réponse arrive : la pop-up n'est pas montrée par-dessus l'écran voulu", async () => {
  const service = creerService({ delai: 600, annonces: [annonce(1)] });
  demarrer(service);
  await pause(1_400);
  assert.equal(service.appels.length, 1);
  noterNotificationOuverte();
  await pause(1_400);
  assert.equal(ouverte(), null);
  assert.deepEqual(vuesDuTest(), []);
});

test("fenêtre jamais montrée (iPhone qui refuse pendant qu'une autre se referme) : repasse à fermée sans être notée, et revient plus tard", async () => {
  const service = creerService([annonce(1)]);
  monde.affichageRefuse = true;
  demarrer(service);
  await pause(APRES_AFFICHAGE_MS);
  assert.equal(ouverte(), 1, "demandée à l'écran");
  await pause(1_700);
  assert.equal(ouverte(), null, "le secours la referme");
  assert.deepEqual(vuesDuTest(), [], "pas notée vue : personne ne l'a lue");
  monde.affichageRefuse = false;
  await absence(31);
  await pause(APRES_AFFICHAGE_MS);
  assert.equal(ouverte(), 1);
  assert.deepEqual(vuesDuTest(), [1]);
});

test("l'écran quitte les onglets pendant que la pop-up est ouverte (notification vers Miam Safe) : elle se ferme et ne revient pas", async () => {
  const service = creerService([annonce(1)]);
  demarrer(service);
  await pause(APRES_AFFICHAGE_MS);
  assert.equal(ouverte(), 1);
  changer({ chemin: "/miam-safe/partage/2" });
  await pause(50);
  assert.equal(ouverte(), null);
  changer({ chemin: "/" });
  await pause(2_200);
  assert.equal(ouverte(), null);
  assert.equal(service.appels.length, 1);
});

test("nouveau lancement de l'app : une pop-up vue ne revient pas", async () => {
  const service = creerService([annonce(1)]);
  demarrer(service);
  await pause(APRES_AFFICHAGE_MS);
  assert.equal(ouverte(), 1);
  racine.unmount();
  monde.etatHook = null;
  monter();
  await pause(2_200);
  assert.equal(service.appels.length, 2);
  assert.equal(ouverte(), null);
});

test("la proposition de nouvelle version est à l'écran : la pop-up attend sa fermeture, puis vient, et tient sa place", async () => {
  const service = creerService([annonce(1)]);
  assert.equal(prendreFenetreDouce("nouvelle-version"), true);
  demarrer(service);
  await pause(APRES_AFFICHAGE_MS + 400);
  assert.equal(ouverte(), null);
  rendreFenetreDouce("nouvelle-version");
  await pause(APRES_AFFICHAGE_MS);
  assert.equal(ouverte(), 1);
  assert.equal(lireFenetreDouce(), "annonce-app");
  assert.equal(prendreFenetreDouce("nouvelle-version"), false, "la proposition attend à son tour");
  monde.etatHook.fermer();
  await pause(50);
  assert.equal(lireFenetreDouce(), null);
});
