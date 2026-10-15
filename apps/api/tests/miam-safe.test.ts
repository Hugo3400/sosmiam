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
    assert.equal(envoi.corps.telephones, 1);
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
    b.validerVisite(lieuId, lea.id);
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
      b.validerVisite(lieuId, compte.id);
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
  assert.equal(ecrireTexteAlerte("terrasse", "table 12"), "En terrasse · table 12. Va discrètement à sa rencontre.");
  assert.equal(ecrireTexteAlerte("salle", ""), "En salle. Va discrètement à sa rencontre.");
});

test("Miam Safe : l'alerte ne part que sur les téléphones encore connectés de l'équipe, jamais sur ceux de son auteur", async () => {
  // Le service se branche sur la base au chargement, sans s'y connecter : la table des téléphones est un double
  process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
  const { prevenirEquipeMiamSafe } = await import("../src/services/notifications/prevenir-equipe-miam-safe.ts");
  const telephones = [
    { id: 1, jeton: "serveur-connecte", plateforme: "ios", compteId: 7, sessionId: 31 as number | null },
    { id: 2, jeton: "ancien-telephone-deconnecte", plateforme: "android", compteId: 7, sessionId: null },
    // La serveuse qui lance l'alerte depuis son propre lieu : son téléphone ne sonne pas
    { id: 3, jeton: "telephone-de-l-autrice", plateforme: "ios", compteId: 9, sessionId: 40 },
  ];
  const filtres: unknown[] = [];
  const table = {
    findMany: async ({ where }: { where: { sessionId?: { not: null }; compteId?: { not: number } } }) => {
      filtres.push(where);
      return telephones
        .filter((t) => (where.sessionId === undefined || t.sessionId !== null) && (where.compteId === undefined || t.compteId !== where.compteId.not))
        .map(({ id, jeton, plateforme }) => ({ id, jeton, plateforme }));
    },
    update: async () => {},
  };
  const recus: string[] = [];
  const nombre = await prevenirEquipeMiamSafe(
    { lieuId: 18, compteId: 9, prenom: "Léa", endroit: "salle", detail: "" },
    async (appareil) => { recus.push(appareil.jeton); return "envoyee"; },
    table as never,
  );
  assert.equal(nombre, 1);
  assert.deepEqual(recus, ["serveur-connecte"]);
  assert.deepEqual((filtres[0] as { sessionId: unknown }).sessionId, { not: null });
  assert.deepEqual((filtres[0] as { compteId: unknown }).compteId, { not: 9 });
});

test("Miam Safe : une notification urgente passe par le canal Android « miam-safe » avec le repère urgent, les autres non", async () => {
  const { construireCorpsGoogle } = await import("../src/services/notifications/expedier-push.ts");
  const urgent = construireCorpsGoogle("jeton", { titre: "🛡 Léa a besoin de toi", texte: "…", lien: "/miam-safe/partage/1", urgent: true });
  assert.deepEqual(urgent.message.android, { priority: "high", notification: { channel_id: "miam-safe", default_sound: true, default_vibrate_timings: true, notification_priority: "PRIORITY_MAX" } });
  assert.deepEqual(urgent.message.data, { lien: "/miam-safe/partage/1", urgent: "1" });
  const simple = construireCorpsGoogle("jeton", { titre: "Coucou", texte: "…", lien: null });
  assert.deepEqual(simple.message.android, { priority: "high", notification: { channel_id: "notifications", default_sound: true, default_vibrate_timings: true, notification_priority: "PRIORITY_HIGH" } });
  assert.deepEqual(simple.message.data, {});
});

test("Miam Safe : « Tu t'es senti·e bien ici ? » n'est accepté qu'après une visite validée dans ce lieu", async () => {
  const b = await creerBancPro();
  try {
    const lieuId = b.ajouterLieu();
    const autreLieu = b.ajouterLieu();
    const lea = await b.creerCompte("Léa");
    const sansVisite = await b.demander("PUT", `/miam-safe/lieux/${lieuId}/senti-bien`, { jeton: lea.jeton, corps: { oui: true } });
    assert.equal(sansVisite.statut, 409);
    assert.equal(sansVisite.corps.erreur, "visite-requise");
    b.validerVisite(autreLieu, lea.id);
    assert.equal((await b.demander("PUT", `/miam-safe/lieux/${lieuId}/senti-bien`, { jeton: lea.jeton, corps: { oui: true } })).statut, 409);
    b.validerVisite(lieuId, lea.id);
    assert.equal((await b.demander("PUT", `/miam-safe/lieux/${lieuId}/senti-bien`, { jeton: lea.jeton, corps: { oui: true } })).statut, 200);
    for (let i = 0; i < 25; i++) {
      const compte = await b.creerCompte(`Faux${i}`);
      await b.demander("PUT", `/miam-safe/lieux/${lieuId}/senti-bien`, { jeton: compte.jeton, corps: { oui: true } });
    }
    assert.equal((await b.demander("GET", `/miam-safe/lieux/${lieuId}`)).corps.repere, false);
  } finally {
    await b.fermer();
  }
});

test("Miam Safe : une réponse « senti bien » ne compte dans le repère que si le compte a une visite validée dans ce lieu", async () => {
  const { creerMiamSafeEnMemoire } = await import("../src/services/miam-safe-en-memoire.ts");
  const visites = new Set<string>();
  const memoire = creerMiamSafeEnMemoire(() => true, (lieuId, compteId) => visites.has(`${lieuId}:${compteId}`));
  for (let compteId = 1; compteId <= 20; compteId++) {
    visites.add(`7:${compteId}`);
    assert.equal(await memoire.services.repondreSentiBien({ lieuId: 7, compteId, oui: true }), "ok");
  }
  assert.equal((await memoire.services.lireLieu(7))?.repere, true);
  visites.delete("7:20");
  assert.equal((await memoire.services.lireLieu(7))?.repere, false);
});

test("Miam Safe : l'alerte dit sur combien de téléphones de l'équipe elle est partie, 0 compris", async () => {
  const b = await creerBancPro();
  try {
    const gerant = await b.creerGerant();
    await b.demander("PUT", `/miam-safe/pro/lieux/${gerant.lieuId}/charte`, { jeton: gerant.jeton, corps: { accepte: true } });
    const lea = await b.creerCompte("Léa");
    b.telephonesEquipe.set(gerant.lieuId, 0);
    const aucun = await b.demander("POST", "/miam-safe/alertes", { jeton: lea.jeton, corps: { lieuId: gerant.lieuId, endroit: "salle" } });
    assert.equal(aucun.statut, 201);
    assert.equal(aucun.corps.telephones, 0);
    b.telephonesEquipe.set(gerant.lieuId, 3);
    const trois = await b.demander("POST", "/miam-safe/alertes", { jeton: lea.jeton, corps: { lieuId: gerant.lieuId, endroit: "terrasse" } });
    assert.equal(trois.corps.telephones, 3);
  } finally {
    await b.fermer();
  }
});

test("Miam Safe : l'alerte est enregistrée et répond 201 même si la lecture des téléphones échoue", async () => {
  const { creerControleursMiamSafe } = await import("../src/controleurs/miam-safe.ts");
  const { creerMiamSafeEnMemoire } = await import("../src/services/miam-safe-en-memoire.ts");
  const memoire = creerMiamSafeEnMemoire(() => true);
  await memoire.services.signerCharte(18, 1, new Date());
  const c = creerControleursMiamSafe({ services: memoire.services, prevenirEquipe: async () => { throw new Error("base"); } }, Date.now);
  const erreurs = console.error;
  console.error = () => {};
  let statut = 0;
  let corps: Record<string, unknown> = {};
  try {
    await c.envoyerAlerte(
      { body: { lieuId: 18, endroit: "salle" } } as never,
      { locals: { compte: { id: 7, prenom: "Léa" } }, status(s: number) { statut = s; return this; }, json(j: Record<string, unknown>) { corps = j; return this; } } as never,
    );
  } finally {
    console.error = erreurs;
  }
  assert.equal(statut, 201);
  assert.deepEqual(corps, { ok: true, id: 1 });
  assert.equal(memoire.alertes.length, 1);
});
