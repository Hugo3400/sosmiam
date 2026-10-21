import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { createElement, useEffect } from "react";
import { creerRacine } from "react-dom/client";

import { monde } from "./doublures/monde.mjs";
import { utiliserVueFeuilleMiamSafe } from "~/hooks/utiliser-vue-feuille-miam-safe";

const vraieImmediate = setImmediate;

let racine = null;

function Sonde({ visible, alerte }) {
  const etat = utiliserVueFeuilleMiamSafe(visible, alerte);
  useEffect(() => {
    monde.vueFeuille = etat;
  });
  return null;
}

const laisser = async () => {
  for (let i = 0; i < 8; i += 1) await new Promise((fin) => vraieImmediate(fin));
};

async function montrer(visible, alerte) {
  racine.render(createElement(Sonde, { visible, alerte }));
  await laisser();
}

async function agir(geste) {
  geste(monde.vueFeuille);
  await laisser();
}

const alerte = (statut, id = 1, telephones = 2) => ({ id, envoyeeLe: Date.now(), telephones, statut, reponduLe: statut === "en-route" ? Date.now() : null, precedentes: [] });

const etat = () => ({ vue: monde.vueFeuille.vue, renvoi: monde.vueFeuille.renvoi });

beforeEach(() => {
  monde.vueFeuille = null;
  racine = creerRacine();
});

afterEach(async () => {
  racine?.unmount();
  racine = null;
  await laisser();
});

test("à l'ouverture : la feuille commence par le choix, les numéros d'abord", async () => {
  await montrer(true, null);
  assert.deepEqual(etat(), { vue: "choix", renvoi: null });
});

test("15 minutes, formulaire « Renvoyer une alerte » ouvert : la vue reste l'alerte, le formulaire est gardé", async () => {
  const sansReponse = alerte("sans-reponse");
  await montrer(true, sansReponse);
  await agir((v) => v.aller("alerte"));
  await agir((v) => v.renvoyer("sans-reponse"));
  assert.deepEqual(etat(), { vue: "alerte", renvoi: "sans-reponse" });
  await montrer(true, null);
  assert.deepEqual(etat(), { vue: "alerte", renvoi: null });
});

test("15 minutes, formulaire « Nouvelle alerte » ouvert après « L'équipe arrive » : gardé aussi", async () => {
  const enRoute = alerte("en-route");
  await montrer(true, enRoute);
  await agir((v) => v.aller("alerte"));
  await agir((v) => v.renvoyer("en-route"));
  await montrer(true, null);
  assert.deepEqual(etat(), { vue: "alerte", renvoi: null });
});

for (const statut of ["envoyee", "sans-reponse", "en-route"]) {
  test(`15 minutes, vue de suivi « ${statut} » ouverte : retour au choix, les numéros d'abord`, async () => {
    await montrer(true, alerte(statut));
    await agir((v) => v.aller("alerte"));
    await montrer(true, null);
    assert.deepEqual(etat(), { vue: "choix", renvoi: null });
  });
}

test("aucun téléphone, « Renvoyer une alerte » : le formulaire reste quand l'alerte passe « sans réponse »", async () => {
  await montrer(true, alerte("envoyee", 1, 0));
  await agir((v) => v.aller("alerte"));
  await agir((v) => v.renvoyer("envoyee"));
  await montrer(true, alerte("sans-reponse", 1, 0));
  assert.deepEqual(etat(), { vue: "alerte", renvoi: "envoyee" });
});

test("« On arrive » sur l'ancienne alerte pendant le formulaire de renvoi : on montre « L'équipe arrive »", async () => {
  await montrer(true, alerte("sans-reponse"));
  await agir((v) => v.aller("alerte"));
  await agir((v) => v.renvoyer("sans-reponse"));
  await montrer(true, alerte("en-route"));
  assert.deepEqual(etat(), { vue: "alerte", renvoi: null });
});

test("« Nouvelle alerte » après « L'équipe arrive » : le formulaire n'est pas refermé par la même réponse", async () => {
  const enRoute = alerte("en-route");
  await montrer(true, enRoute);
  await agir((v) => v.aller("alerte"));
  await agir((v) => v.renvoyer("en-route"));
  await montrer(true, { ...enRoute });
  assert.deepEqual(etat(), { vue: "alerte", renvoi: "en-route" });
});

test("alerte envoyée depuis le formulaire de renvoi : on revient au suivi de la nouvelle", async () => {
  await montrer(true, alerte("sans-reponse"));
  await agir((v) => v.aller("alerte"));
  await agir((v) => v.renvoyer("sans-reponse"));
  await agir((v) => v.renvoyer(null));
  await montrer(true, alerte("envoyee", 2));
  assert.deepEqual(etat(), { vue: "alerte", renvoi: null });
});

test("« Retour » au choix, puis une autre vue : le mode renvoi est oublié", async () => {
  await montrer(true, alerte("sans-reponse"));
  await agir((v) => v.aller("alerte"));
  await agir((v) => v.renvoyer("sans-reponse"));
  await agir((v) => v.aller("choix"));
  assert.deepEqual(etat(), { vue: "choix", renvoi: null });
  await agir((v) => v.aller("alerte"));
  assert.deepEqual(etat(), { vue: "alerte", renvoi: null });
});

test("feuille refermée puis rouverte : retour au choix, mode renvoi oublié", async () => {
  const sansReponse = alerte("sans-reponse");
  await montrer(true, sansReponse);
  await agir((v) => v.aller("alerte"));
  await agir((v) => v.renvoyer("sans-reponse"));
  await montrer(false, sansReponse);
  await montrer(true, sansReponse);
  assert.deepEqual(etat(), { vue: "choix", renvoi: null });
});

test("première alerte : le formulaire ouvert reste quand elle part", async () => {
  await montrer(true, null);
  await agir((v) => v.aller("alerte"));
  await montrer(true, alerte("envoyee"));
  assert.deepEqual(etat(), { vue: "alerte", renvoi: null });
});

test("une autre vue ouverte (prévenir un pote) n'est pas touchée par la fin des 15 minutes", async () => {
  await montrer(true, alerte("sans-reponse"));
  await agir((v) => v.aller("pote"));
  await montrer(true, null);
  assert.deepEqual(etat(), { vue: "pote", renvoi: null });
});
