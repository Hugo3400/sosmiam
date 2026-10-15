// L'avatar, essais du vérificateur sceptique : les courses (une minuterie, un retour dans l'app ou Mes infos pendant
// l'écriture d'un choix), la déconnexion en plein envoi, les boucles, le disque plein. Les écritures lentes passent par
// les délais des doublures (__delaiAvatar, __delaiMagasin, __delaiEcriture), remis à zéro avant chaque essai.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { BURRITO, DEFAUT, GRENOUILLE, LOCAL, PHOTO_A, PIZZA, TACO, TOQUE, VU, etat, lireEtatGarde as garde } from "./banc/donnees.mjs";
import { declencher, pause } from "./banc/minuteries.mjs";
import { demarrer, lirePatchsAvecAvatar, monter, remettreDoublures } from "./banc/serveur.mjs";

beforeEach(remettreDoublures);

/** Le compte du banc qui a 🍕, sur le serveur comme sur le téléphone */
const AVEC_PIZZA = { magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" }, avatar: PIZZA };
const ZOE = { ...LOCAL, prenom: "Zoe", pseudo: "zoe" };

/** Ferme la synchro comme FournisseurProfil.effacer (déconnexion) */
function effacer(moteur) {
  globalThis.__avatarDisque = null;
  moteur.poserAvatar(DEFAUT);
  moteur.poserProfil(null);
}

test("S1. une minuterie part pendant l'écriture du nouvel avatar (marque posée, pas encore écrit) : 🌮 reste et part", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  // Un 🌯 attend (hors ligne), le nouvel essai est prévu
  s.horsLigne = true;
  await moteur.modifierAvatar(BURRITO);
  await pause(40);
  s.horsLigne = false;
  s.demandes.length = 0;
  globalThis.__delaiAvatar = 30;
  const p = moteur.modifierAvatar(TACO);
  await pause(5); // marque posée, avatar pas encore écrit
  await declencher(); // le nouvel essai part maintenant
  await p;
  await pause(80);
  assert.deepEqual(s.avatar, TACO, "demandes " + JSON.stringify(s.demandes));
  assert.equal(s.serveur.avatar, "🌮");
});

test("S2. deux choix rapides, sans attendre le premier (écritures lentes) : 🌮 gagne partout", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: null }) });
  s.demandes.length = 0;
  globalThis.__delaiAvatar = 10;
  globalThis.__delaiMagasin = 3;
  const a = moteur.modifierAvatar(PIZZA);
  const b = moteur.modifierAvatar(TACO);
  await Promise.all([a, b]);
  await pause(150);
  assert.deepEqual(s.avatar, TACO, "demandes " + JSON.stringify(s.demandes));
  assert.equal(s.serveur.avatar, "🌮");
  assert.deepEqual(garde().aEnvoyer, []);
});

test("S3. retour dans l'app pendant l'écriture du nouvel avatar (dernière lecture vieille d'une minute) : 🌮 reste et part", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  globalThis.__delaiAvatar = 30;
  const p = moteur.modifierAvatar(TACO);
  await pause(5);
  const maintenant = Date.now;
  Date.now = () => maintenant() + 120_000;
  try {
    moteur.auPremierPlan();
  } finally {
    Date.now = maintenant;
  }
  await p;
  await pause(80);
  assert.deepEqual(s.avatar, TACO, "demandes " + JSON.stringify(s.demandes));
  assert.equal(s.serveur.avatar, "🌮");
});

test("S4. choix pendant une relecture en vol, le serveur a changé entre-temps (autre téléphone : 🌯) : 🌮 gagne et part", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  s.serveur.avatar = "🌯";
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  moteur.activer(false);
  moteur.activer(true); // GET en vol
  await pause(5);
  await moteur.modifierAvatar(TACO);
  lacher();
  s.retard = null;
  await pause(100);
  assert.deepEqual(s.avatar, TACO, "demandes " + JSON.stringify(s.demandes));
  assert.equal(s.serveur.avatar, "🌮");
  assert.deepEqual(garde().aEnvoyer, []);
});

test("S5. déconnexion pendant l'envoi, puis compte B : la réponse de A est ignorée, B adopte 🐸, rien de A ne part", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  const p = moteur.modifierAvatar(TACO); // PATCH 🌮 en vol pour A
  await pause(10);
  await moteur.oublier();
  effacer(moteur);
  moteur.activer(false);
  await moteur.installer({ ...ZOE });
  lacher(); // la réponse de A arrive chez B (le PATCH de A a bien écrit chez A)
  s.retard = null;
  await p;
  await pause(30);
  const serveurA = s.serveur.avatar;
  const apresReponseA = structuredClone(s.avatar);
  s.serveur = { ...VU, prenom: "Zoe", pseudo: "zoe", avatar: "🐸" };
  moteur.activer(true);
  await pause(100);
  assert.equal(serveurA, "🌮", "le PATCH de A est arrivé chez A");
  assert.deepEqual(apresReponseA, DEFAUT, "la réponse de A ne touche pas l'avatar de B");
  assert.deepEqual(s.avatar, GRENOUILLE, "B adopte son avatar");
  assert.deepEqual(s.demandes, ['PATCH {"avatar":"🌮"}', "GET"], "rien de A ne part pour B");
  assert.deepEqual(garde().aEnvoyer, []);
});

test("S5b. déconnexion pendant l'écriture d'un choix (marque posée dans la mémoire de A) : rien ne suit chez B", async () => {
  globalThis.__delaiAvatar = 30;
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  const p = moteur.modifierAvatar(TACO);
  await pause(5);
  const o = moteur.oublier();
  await p;
  await o;
  effacer(moteur);
  moteur.activer(false);
  globalThis.__delaiAvatar = 0;
  await moteur.installer({ ...ZOE });
  s.serveur = { ...VU, prenom: "Zoe", pseudo: "zoe", avatar: null };
  moteur.activer(true);
  await pause(100);
  assert.deepEqual(lirePatchsAvecAvatar(s), [], "B ne reçoit pas 🌮 | demandes " + JSON.stringify(s.demandes));
  assert.deepEqual(s.avatar, DEFAUT);
  assert.equal(s.serveur.avatar, null);
});

test("S6. reprise d'une photo au démarrage avec une marque « avatar » restée d'avant : aucun avatar ne part, la photo reste", async () => {
  const { s } = await demarrer({ ...AVEC_PIZZA, magasin: etat({ avatarServeur: "🍕", aEnvoyer: [{ champ: "avatar", numero: 1 }] }), avatar: PHOTO_A });
  assert.deepEqual(lirePatchsAvecAvatar(s), [], "demandes " + JSON.stringify(s.demandes));
  assert.deepEqual(s.avatar, PHOTO_A);
  assert.deepEqual(garde().aEnvoyer, []);
});

test("S7a. avatar effacé par l'équipe juste après l'envoi : retour au défaut, pas de renvoi en boucle", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  await moteur.modifierAvatar(TACO);
  await pause(5);
  s.serveur.avatar = null; // le PATCH est passé, l'équipe efface aussitôt
  for (let i = 0; i < 3; i++) {
    moteur.activer(false);
    moteur.activer(true);
    await pause(40);
  }
  assert.equal(lirePatchsAvecAvatar(s).length, 1, "demandes " + JSON.stringify(s.demandes));
  assert.deepEqual(s.avatar, DEFAUT);
});

test("S7b. Miami inconnu sur le serveur, rattrapage : rien ne part, jamais", async () => {
  const { moteur, s } = await demarrer({ magasin: etat(), serveur: { ...VU, avatar: "miami:licorne" }, avatar: TOQUE });
  for (let i = 0; i < 3; i++) {
    moteur.activer(false);
    moteur.activer(true);
    await pause(40);
  }
  assert.deepEqual(lirePatchsAvecAvatar(s), [], "demandes " + JSON.stringify(s.demandes));
  assert.deepEqual(s.avatar, TOQUE);
});

test("S7c. compte limité, téléphone d'avant l'avatar : le rattrapage ne repart pas à chaque lancement", async () => {
  let total = 0;
  for (let lancement = 0; lancement < 3; lancement++) {
    const magasin = lancement === 0 ? etat() : [...globalThis.__magasin.entries()];
    const { s } = await demarrer({ magasin, serveur: { ...VU, avatar: null }, avatar: PIZZA, limite: true });
    total += lirePatchsAvecAvatar(s).length;
    await pause(20);
  }
  assert.equal(total, 1, "PATCH avec avatar sur 3 lancements | gardé " + JSON.stringify(garde()));
});

test("S8. photo, puis Mes infos et relecture : la photo ne part jamais", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  await moteur.modifierAvatar(PHOTO_A);
  await pause(40);
  await moteur.modifierInfos({ ville: "Lyon" });
  await pause(40);
  moteur.activer(false);
  moteur.activer(true);
  await pause(40);
  assert.ok(!s.demandes.some((d) => d.includes("photo") || d.includes("file:")), "demandes " + JSON.stringify(s.demandes));
  assert.deepEqual(lirePatchsAvecAvatar(s), []);
  assert.deepEqual(s.avatar, PHOTO_A);
});

test("S9. Mes infos pendant l'écriture d'un nouvel avatar : 🌮 reste et part avec la ville", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  globalThis.__delaiAvatar = 30;
  const p = moteur.modifierAvatar(TACO);
  await pause(5);
  const r = moteur.modifierInfos({ ville: "Lyon" });
  await Promise.all([p, r]);
  await pause(100);
  assert.deepEqual(s.avatar, TACO, "demandes " + JSON.stringify(s.demandes));
  assert.equal(s.serveur.avatar, "🌮");
  assert.equal(s.serveur.ville, "Lyon");
});

test("S10. une minuterie part pendant l'écriture de Mes envies : restos reste et part", async () => {
  const { moteur, s } = await demarrer({ magasin: etat({ avatarServeur: null }) });
  s.demandes.length = 0;
  s.horsLigne = true;
  await moteur.modifierEnvies({ lieux: ["bars"] });
  await pause(40);
  s.horsLigne = false;
  s.demandes.length = 0;
  globalThis.__delaiEcriture = 30;
  const p = moteur.modifierEnvies({ lieux: ["restos"] });
  await pause(5);
  await declencher();
  await p;
  await pause(100);
  assert.deepEqual(s.profil?.envies?.lieux, ["restos"], "demandes " + JSON.stringify(s.demandes));
  assert.deepEqual(s.serveur.envies?.lieux, ["restos"]);
});

test("S12. connexion depuis une visite (🍕) à un compte en 🌯 : 🌯 adopté, rien ne part", async () => {
  const { moteur, s } = await demarrer({ profil: null, avatar: PIZZA });
  await moteur.installer(structuredClone(LOCAL));
  s.serveur = { ...VU, avatar: "🌯" };
  moteur.activer(true);
  await pause(80);
  assert.deepEqual(s.avatar, BURRITO);
  assert.deepEqual(lirePatchsAvecAvatar(s), [], "demandes " + JSON.stringify(s.demandes));
});

test("S13. rattrapage : l'avatar du téléphone part une seule fois", async () => {
  const { s } = await demarrer({ magasin: etat(), serveur: { ...VU, avatar: null }, avatar: PIZZA });
  assert.equal(lirePatchsAvecAvatar(s).length, 1, "demandes " + JSON.stringify(s.demandes));
  assert.equal(s.serveur.avatar, "🍕");
});

test("S14. photo choisie pendant l'envoi d'un emoji : la photo reste, le serveur garde 🌮, aucune autre demande d'avatar", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  s.demandes.length = 0;
  let lacher;
  s.retard = new Promise((r) => (lacher = r));
  const p = moteur.modifierAvatar(TACO);
  await pause(10);
  await moteur.modifierAvatar(PHOTO_A);
  lacher();
  s.retard = null;
  await p;
  await pause(80);
  assert.deepEqual(s.avatar, PHOTO_A);
  assert.equal(s.serveur.avatar, "🌮");
  assert.equal(lirePatchsAvecAvatar(s).length, 1, "demandes " + JSON.stringify(s.demandes));
  assert.deepEqual(garde().aEnvoyer, []);
});

test("S15. choix avant la fin du démarrage (état gardé pas encore relu, synchro éteinte) : la marque survit, 🌮 part", async () => {
  const t = monter({ magasin: etat({ avatarServeur: "🍕" }), serveur: { ...VU, avatar: "🍕" } });
  t.moteur.poserAvatar(PIZZA);
  t.moteur.poserProfil(structuredClone(LOCAL));
  await t.moteur.modifierAvatar(TACO); // avant charger et activer
  t.moteur.charger();
  await pause(5);
  t.moteur.activer(true);
  await pause(80);
  assert.equal(t.s.serveur.avatar, "🌮", "demandes " + JSON.stringify(t.s.demandes));
  assert.deepEqual(t.s.avatar, TACO);
});

test("disque plein, puis synchro : aucune marque restée, le téléphone adopte l'avatar choisi ailleurs (🌯), rien ne part", async () => {
  const { moteur, s } = await demarrer(AVEC_PIZZA);
  globalThis.__avatarEchec = true;
  s.demandes.length = 0;
  await moteur.modifierAvatar(TACO).catch(() => {});
  await pause(20);
  globalThis.__avatarEchec = false;
  const marques = structuredClone(garde().aEnvoyer);
  s.serveur.avatar = "🌯"; // changé depuis un autre téléphone entre-temps
  moteur.activer(false);
  moteur.activer(true);
  await pause(80);
  assert.deepEqual(marques, [], "les marques d'avant reviennent (aucune)");
  assert.deepEqual(s.demandes, ["GET"]);
  assert.equal(s.serveur.avatar, "🌯");
  assert.deepEqual(s.avatar, BURRITO);
});
