import assert from "node:assert/strict";
import { test } from "node:test";

import { envoyerOffresTelephone } from "~/fonctions/notifications/envoyer-offres-telephone";

const JETON_NATIF = "natif-0123456789abcdefghij";
const JETON_GARDE = "garde-0123456789abcdefghij";

function creerOutils(o = {}) {
  const demandes = [];
  const inscriptions = [];
  const enregistres = [];
  const outils = {
    demo: false,
    ville: "Montpellier",
    plateforme: "ios",
    lireActives: async () => true,
    lireJeton: async (demander) => {
      demandes.push(demander);
      return o.lu ?? { ok: true, jeton: JETON_NATIF, plateforme: "ios" };
    },
    lireJetonGarde: async () => (o.garde === undefined ? JETON_GARDE : o.garde),
    inscrire: async (inscription) => {
      inscriptions.push(inscription);
      return o.reponse ?? { ok: true };
    },
    enregistrerJeton: async (jeton) => void enregistres.push(jeton),
    ...o.outils,
  };
  return { outils, demandes, inscriptions, enregistres };
}

test("jamais de question au système, même pour un « oui »", async () => {
  for (const offres of [true, false]) {
    const t = creerOutils({ lu: { ok: false, raison: "a-demander" } });
    await envoyerOffresTelephone(offres, t.outils);
    assert.deepEqual(t.demandes, [false]);
  }
});

test("autorisation donnée : le jeton natif part, avec la ville et le choix", async () => {
  const t = creerOutils();
  assert.equal(await envoyerOffresTelephone(true, t.outils), "parti");
  assert.deepEqual(t.inscriptions, [{ jeton: JETON_NATIF, plateforme: "ios", ville: "Montpellier", offres: true }]);
  assert.deepEqual(t.enregistres, [JETON_NATIF]);
});

test("éteindre sans autorisation du système : le jeton gardé part quand même, pour retirer l'accord", async () => {
  for (const raison of ["a-demander", "refusee", "indisponible"]) {
    const t = creerOutils({ lu: { ok: false, raison }, outils: { plateforme: "android" } });
    assert.equal(await envoyerOffresTelephone(false, t.outils), "parti");
    assert.deepEqual(t.inscriptions, [{ jeton: JETON_GARDE, plateforme: "android", ville: "Montpellier", offres: false }]);
    assert.deepEqual(t.enregistres, []);
  }
});

test("allumer sans autorisation : rien ne part (jamais d'accord avec un vieux jeton)", async () => {
  const t = creerOutils({ lu: { ok: false, raison: "refusee" } });
  assert.equal(await envoyerOffresTelephone(true, t.outils), "sans-suite");
  assert.deepEqual(t.inscriptions, []);
});

test("éteindre sans autorisation ni jeton gardé : rien à retirer", async () => {
  const t = creerOutils({ lu: { ok: false, raison: "refusee" }, garde: null });
  assert.equal(await envoyerOffresTelephone(false, t.outils), "sans-suite");
  assert.deepEqual(t.inscriptions, []);
});

test("navigateur : pas de plateforme de téléphone, rien ne part", async () => {
  const t = creerOutils({ lu: { ok: false, raison: "indisponible" }, outils: { plateforme: "web" } });
  assert.equal(await envoyerOffresTelephone(false, t.outils), "sans-suite");
  assert.deepEqual(t.inscriptions, []);
});

test("démo ou notifications coupées : rien ne part (un PUT réinscrirait le téléphone)", async () => {
  for (const outils of [{ demo: true }, { lireActives: async () => false }]) {
    const t = creerOutils({ outils });
    assert.equal(await envoyerOffresTelephone(false, t.outils), "sans-suite");
    assert.deepEqual(t.inscriptions, []);
    assert.deepEqual(t.demandes, []);
  }
});

test("pas de réseau, serveur en panne, trop de demandes : à renvoyer", async () => {
  for (const erreur of ["hors-ligne", "erreur-serveur", "trop-de-demandes", "service-indisponible"]) {
    const t = creerOutils({ reponse: { ok: false, erreur } });
    assert.equal(await envoyerOffresTelephone(false, t.outils), "a-renvoyer");
    assert.deepEqual(t.enregistres, []);
  }
});

test("refus définitif (champ invalide) : pas de nouvel essai en boucle", async () => {
  const t = creerOutils({ reponse: { ok: false, erreur: "champ-invalide", champ: "ville" } });
  assert.equal(await envoyerOffresTelephone(false, t.outils), "sans-suite");
});

test("ville vide : envoyée comme null", async () => {
  const t = creerOutils({ outils: { ville: "" } });
  await envoyerOffresTelephone(false, t.outils);
  assert.equal(t.inscriptions[0].ville, null);
});
