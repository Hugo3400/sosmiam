// Tests des vues des fiches dans l'app (POST /app/lieux/:id/vue) : sans session, une vue par visiteur, par lieu et par jour de
// Paris, seulement pour un lieu publié, 120 par visiteur toutes les 10 minutes, et rien d'autre que le compteur n'est écrit.
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { creerBancStatistiques } from "./outils/creer-banc-statistiques.ts";

let b: Awaited<ReturnType<typeof creerBancStatistiques>>;
beforeEach(async () => {
  b = await creerBancStatistiques();
  b.vider();
});
afterEach(() => b.fermer());

const vue = (lieu: number | string, ip: string, jeton?: string) => b.demander("POST", `/app/lieux/${lieu}/vue`, { ip, jeton });

test("une vue par visiteur, par lieu et par jour, et seulement le compteur", async () => {
  const r = await vue(1, "203.0.113.7");
  assert.deepEqual([r.statut, r.corps, r.entetes.get("cache-control")], [204, null, "no-store"]);
  assert.equal((await vue(1, "203.0.113.7")).statut, 204);
  assert.equal(b.vues.lire(1, "2026-10-09"), 1);
  // Un autre visiteur, puis le même visiteur sur un autre lieu
  await vue(1, "203.0.113.8");
  await vue(2, "203.0.113.7");
  // IPv6 : un foyer (son préfixe /56) compte pour un seul visiteur
  await vue(1, "2a01:e0a:12:3400::1");
  await vue(1, "2a01:e0a:12:34ff:abcd::9");
  assert.deepEqual(b.vues.vues, [{ lieuId: 1, jour: "2026-10-09", nombre: 3 }, { lieuId: 2, jour: "2026-10-09", nombre: 1 }]);
});

test("le jour de Paris : une nouvelle vue après minuit, heure de Paris", async () => {
  // 23 h 59 à Paris, le 9 octobre (21 h 59 UTC)
  b.banc.horloge = Date.parse("2026-10-09T21:59:00Z");
  await vue(1, "198.51.100.4");
  // 0 h 01 à Paris, le 10 octobre (22 h 01 UTC le 9)
  b.banc.horloge = Date.parse("2026-10-09T22:01:00Z");
  await vue(1, "198.51.100.4");
  await vue(1, "198.51.100.4");
  assert.deepEqual(b.vues.vues, [{ lieuId: 1, jour: "2026-10-09", nombre: 1 }, { lieuId: 1, jour: "2026-10-10", nombre: 1 }]);
});

test("lieu inconnu, brouillon ou masqué : 404 lieu-inconnu, rien d'écrit ni de retenu", async () => {
  b.vues.publies.delete(2);
  for (const lieu of [2, 2, 999, "abc", "0", "-3", "1.5"]) {
    const r = await vue(lieu, "192.0.2.10");
    assert.deepEqual([r.statut, r.corps], [404, { ok: false, erreur: "lieu-inconnu" }], String(lieu));
  }
  assert.deepEqual(b.vues.vues, []);
  // Publié ensuite : la vue du même visiteur compte (le refus n'a rien retenu)
  b.vues.publies.add(2);
  assert.equal((await vue(2, "192.0.2.10")).statut, 204);
  assert.equal(b.vues.lire(2, "2026-10-09"), 1);
});

test("limite : 120 vues en 10 minutes par visiteur, puis 429", async () => {
  for (let i = 0; i < 120; i++) assert.equal((await vue(1 + (i % 2), "192.0.2.50")).statut, 204, `vue ${i + 1}`);
  const trop = await vue(1, "192.0.2.50");
  assert.deepEqual([trop.statut, trop.corps], [429, { ok: false, erreur: "trop-de-demandes" }]);
  assert.ok(Number(trop.entetes.get("retry-after")) > 0);
  // Les autres visiteurs ne sont pas gênés ; le visiteur limité n'a compté qu'une vue par lieu
  assert.equal((await vue(1, "192.0.2.51")).statut, 204);
  assert.deepEqual(b.vues.vues, [{ lieuId: 1, jour: "2026-10-09", nombre: 2 }, { lieuId: 2, jour: "2026-10-09", nombre: 1 }]);
});

test("sans session, et le reste passe au routeur suivant", async () => {
  // Une session (même fausse) n'est ni demandée ni lue
  assert.equal((await vue(1, "192.0.2.60", "x".repeat(43))).statut, 204);
  for (const [methode, chemin] of [["GET", "/app/lieux/1/vue"], ["POST", "/app/lieux/1"], ["POST", "/app/lieux/1/vue/encore"], ["PUT", "/app/lieux/1/vue"]]) {
    const r = await b.demander(methode, chemin, { ip: "192.0.2.61" });
    assert.deepEqual([r.statut, r.corps?.erreur], [404, "introuvable"], `${methode} ${chemin}`);
  }
  assert.equal(b.vues.lire(1, "2026-10-09"), 1);
});

test("écriture ratée : 500, et la vue n'est pas retenue (un nouvel essai compte)", async () => {
  const ajouterVue = b.vues.services.ajouterVue;
  const journal = console.error;
  b.vues.services.ajouterVue = async () => {
    throw new Error("base en panne");
  };
  console.error = () => {};
  try {
    assert.deepEqual((await vue(1, "192.0.2.70")).corps, { ok: false, erreur: "erreur-serveur" });
  } finally {
    console.error = journal;
    b.vues.services.ajouterVue = ajouterVue;
  }
  assert.equal((await vue(1, "192.0.2.70")).statut, 204);
  assert.equal(b.vues.lire(1, "2026-10-09"), 1);
});

test("plafond de la journée : au-delà, plus rien n'est compté jusqu'à minuit", async () => {
  await b.fermer();
  b = await creerBancStatistiques({ retenuesMax: 2 });
  b.vider();
  for (const ip of ["192.0.2.80", "192.0.2.81", "192.0.2.82"]) assert.equal((await vue(1, ip)).statut, 204);
  assert.equal(b.vues.lire(1, "2026-10-09"), 2);
  // Le lendemain, tout est oublié : ça recompte
  b.banc.horloge = Date.parse("2026-10-10T08:00:00Z");
  await vue(1, "192.0.2.82");
  assert.equal(b.vues.lire(1, "2026-10-10"), 1);
});
