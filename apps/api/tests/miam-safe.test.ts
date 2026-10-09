import { test } from "node:test";
import assert from "node:assert/strict";

import { ecrireTexteAlerte } from "../src/fonctions/miam-safe/ecrire-texte-alerte.ts";
import { creerBancPro } from "./outils/creer-banc-pro.ts";

test("Miam Safe : un lieu sans charte n'est pas engagé, et refuse les alertes silencieuses", async () => {
  const b = await creerBancPro();
  try {
    const lieuId = b.ajouterLieu();
    const lea = await b.creerCompte("Léa");
    assert.deepEqual((await b.demander("GET", `/miam-safe/lieux/${lieuId}`)).corps, { ok: true, engage: false, repere: false });
    const r = await b.demander("POST", "/miam-safe/alertes", { jeton: lea.jeton, corps: { lieuId, endroit: "salle" } });
    assert.equal(r.statut, 409);
    assert.equal(r.corps.erreur, "pas-miam-safe");
    assert.equal(b.equipesPrevenues.length, 0);
  } finally {
    await b.fermer();
  }
});

test("Miam Safe : le gérant signe la charte, l'alerte part, l'équipe dit « On arrive »", async () => {
  const b = await creerBancPro();
  try {
    const gerant = await b.creerGerant();
    const lieuId = gerant.lieuId;
    const signee = await b.demander("PUT", `/miam-safe/pro/lieux/${lieuId}/charte`, { jeton: gerant.jeton, corps: { accepte: true } });
    assert.equal(signee.statut, 200);
    assert.equal(signee.corps.charte.signee, true);
    assert.equal((await b.demander("GET", `/miam-safe/lieux/${lieuId}`)).corps.engage, true);

    const lea = await b.creerCompte("Léa");
    const envoi = await b.demander("POST", "/miam-safe/alertes", { jeton: lea.jeton, corps: { lieuId, endroit: "terrasse", detail: "  table 12,   pull vert " } });
    assert.equal(envoi.statut, 201);
    assert.equal(b.equipesPrevenues.length, 1);
    assert.equal(b.equipesPrevenues[0].prenom, "Léa");
    assert.equal(b.equipesPrevenues[0].detail, "table 12, pull vert");

    const suivi = () => b.demander("GET", `/miam-safe/alertes/${envoi.corps.id}`, { jeton: lea.jeton });
    assert.equal((await suivi()).corps.alerte.statut, "envoyee");

    // Le comptoir la voit, avec le prénom seulement
    const comptoir = await b.demander("GET", `/miam-safe/pro/lieux/${lieuId}/alertes`, { jeton: gerant.jeton });
    assert.deepEqual(Object.keys(comptoir.corps.alertes[0]).sort(), ["creeLe", "detail", "endroit", "id", "prenom", "statut"]);

    const onArrive = await b.demander("POST", `/miam-safe/pro/lieux/${lieuId}/alertes/${envoi.corps.id}/on-arrive`, { jeton: gerant.jeton });
    assert.equal(onArrive.statut, 200);
    assert.equal((await suivi()).corps.alerte.statut, "en-route");

    // Une autre personne ne peut pas suivre l'alerte de Léa
    const tom = await b.creerCompte("Tom");
    assert.equal((await b.demander("GET", `/miam-safe/alertes/${envoi.corps.id}`, { jeton: tom.jeton })).statut, 404);
    // Ni lire le comptoir d'un lieu qui n'est pas le sien
    assert.equal((await b.demander("GET", `/miam-safe/pro/lieux/${lieuId}/alertes`, { jeton: tom.jeton })).statut, 403);
  } finally {
    await b.fermer();
  }
});

test("Miam Safe : sans « On arrive » au bout de 2 minutes, l'alerte est « sans réponse »", async () => {
  const b = await creerBancPro();
  try {
    const gerant = await b.creerGerant();
    await b.demander("PUT", `/miam-safe/pro/lieux/${gerant.lieuId}/charte`, { jeton: gerant.jeton, corps: { accepte: true } });
    const lea = await b.creerCompte("Léa");
    const envoi = await b.demander("POST", "/miam-safe/alertes", { jeton: lea.jeton, corps: { lieuId: gerant.lieuId, endroit: "toilettes" } });
    b.banc.horloge += 119_000;
    assert.equal((await b.demander("GET", `/miam-safe/alertes/${envoi.corps.id}`, { jeton: lea.jeton })).corps.alerte.statut, "envoyee");
    b.banc.horloge += 1_000;
    assert.equal((await b.demander("GET", `/miam-safe/alertes/${envoi.corps.id}`, { jeton: lea.jeton })).corps.alerte.statut, "sans-reponse");
  } finally {
    await b.fermer();
  }
});

test("Miam Safe : une charte retirée par l'équipe SOS Miam ne se re-signe pas ; sans « accepte », rien n'est signé", async () => {
  const b = await creerBancPro();
  try {
    const gerant = await b.creerGerant();
    await b.demander("PUT", `/miam-safe/pro/lieux/${gerant.lieuId}/charte`, { jeton: gerant.jeton, corps: { accepte: true } });
    b.miamSafe.retirerParEquipe(gerant.lieuId, "signalement retenu", new Date(b.banc.horloge));
    const r = await b.demander("PUT", `/miam-safe/pro/lieux/${gerant.lieuId}/charte`, { jeton: gerant.jeton, corps: { accepte: true } });
    assert.equal(r.statut, 409);
    assert.equal(r.corps.erreur, "charte-retiree");
    assert.equal((await b.demander("GET", `/miam-safe/lieux/${gerant.lieuId}`)).corps.engage, false);
    // Sans { accepte: true }, rien n'est signé
    const autre = await b.creerGerant();
    assert.equal((await b.demander("PUT", `/miam-safe/pro/lieux/${autre.lieuId}/charte`, { jeton: autre.jeton, corps: {} })).statut, 400);
  } finally {
    await b.fermer();
  }
});

test("Miam Safe : signalements et « Tu t'es senti·e bien ici ? » demandent un compte et un lieu publié", async () => {
  const b = await creerBancPro();
  try {
    const lieuId = b.ajouterLieu();
    const brouillon = b.ajouterLieu({ statut: "brouillon" });
    assert.equal((await b.demander("POST", "/miam-safe/signalements", { corps: { lieuId, raison: "harcelement" } })).statut, 401);
    const lea = await b.creerCompte("Léa");
    assert.equal((await b.demander("POST", "/miam-safe/signalements", { jeton: lea.jeton, corps: { lieuId, raison: "harcelement" } })).statut, 201);
    assert.equal((await b.demander("POST", "/miam-safe/signalements", { jeton: lea.jeton, corps: { lieuId: brouillon, raison: "harcelement" } })).statut, 404);
    const autre = await b.demander("POST", "/miam-safe/signalements", { jeton: lea.jeton, corps: { lieuId, raison: "autre", explication: "bof" } });
    assert.equal(autre.statut, 400);
    assert.equal(autre.corps.champ, "explication");
    assert.equal(b.miamSafe.signalements.length, 1);

    assert.equal((await b.demander("PUT", `/miam-safe/lieux/${lieuId}/senti-bien`, { jeton: lea.jeton, corps: { oui: "oui" } })).statut, 400);
    assert.equal((await b.demander("PUT", `/miam-safe/lieux/${lieuId}/senti-bien`, { jeton: lea.jeton, corps: { oui: true } })).statut, 200);
  } finally {
    await b.fermer();
  }
});

test("Miam Safe : le repère « Les Miamis s'y sentent bien » apparaît à 90 % de oui sur 20 réponses", async () => {
  const b = await creerBancPro();
  try {
    const lieuId = b.ajouterLieu();
    for (let i = 0; i < 20; i++) {
      const compte = await b.creerCompte(`Miami${i}`);
      await b.demander("PUT", `/miam-safe/lieux/${lieuId}/senti-bien`, { jeton: compte.jeton, corps: { oui: i >= 2 } });
    }
    assert.equal((await b.demander("GET", `/miam-safe/lieux/${lieuId}`)).corps.repere, true);
  } finally {
    await b.fermer();
  }
});

test("Miam Safe : 3 alertes par compte toutes les 10 minutes", async () => {
  const b = await creerBancPro();
  try {
    const gerant = await b.creerGerant();
    await b.demander("PUT", `/miam-safe/pro/lieux/${gerant.lieuId}/charte`, { jeton: gerant.jeton, corps: { accepte: true } });
    const lea = await b.creerCompte("Léa");
    const statuts = [];
    for (let i = 0; i < 4; i++) statuts.push((await b.demander("POST", "/miam-safe/alertes", { jeton: lea.jeton, corps: { lieuId: gerant.lieuId, endroit: "salle" } })).statut);
    assert.deepEqual(statuts, [201, 201, 201, 429]);
  } finally {
    await b.fermer();
  }
});

test("Miam Safe : le texte de la notification dit où, jamais qui en entier", () => {
  assert.equal(ecrireTexteAlerte("terrasse", "table 12"), "En terrasse · table 12. Va la voir discrètement.");
  assert.equal(ecrireTexteAlerte("salle", ""), "En salle. Va la voir discrètement.");
});
