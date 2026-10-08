// Tests de la route « Me localiser », avec un faux service : aucun appel réel à geo.api.gouv.fr.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import type { Commune } from "../src/services/localisation.ts";

const demandes: [number, number][] = [];
let reponseService: Commune | null | "panne" = null;
let adresse = "";
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  trouverCommune: async (latitude, longitude) => {
    demandes.push([latitude, longitude]);
    if (reponseService === "panne") throw new Error("geo.api.gouv.fr ne répond pas");
    return reponseService;
  },
}).listen(0, "127.0.0.1");

before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
beforeEach(() => {
  demandes.length = 0;
  reponseService = { commune: "Castelnau-le-Lez", departement: "Hérault", region: "Occitanie" };
});

let visiteur = 0;
function localiser(corps: unknown, ip = `203.0.113.${++visiteur}`) {
  return fetch(`${adresse}/localisation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-IP-Visiteur": ip },
    body: JSON.stringify(corps),
  });
}

test("une position en France renvoie sa commune, après arrondi à environ 100 m", async () => {
  const reponse = await localiser({ latitude: 43.629_456, longitude: 3.931_234 });
  assert.equal(reponse.status, 200);
  assert.deepEqual(await reponse.json(), { ok: true, commune: "Castelnau-le-Lez", departement: "Hérault", region: "Occitanie" });
  assert.deepEqual(demandes, [[43.629, 3.931]]);
});

test("une position donnée en texte est acceptée", async () => {
  assert.equal((await localiser({ latitude: "48.853", longitude: "2.349" })).status, 200);
});

test("une position absente, vide ou hors des limites est refusée sans appeler le service", async () => {
  for (const corps of [{}, { latitude: "", longitude: "" }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }, { latitude: "nord", longitude: 2 }]) {
    const reponse = await localiser(corps);
    assert.equal(reponse.status, 400);
    assert.deepEqual(await reponse.json(), { ok: false, erreur: "position-invalide" });
  }
  assert.equal(demandes.length, 0);
});

test("hors de France : 404, et service en panne : 502", async () => {
  reponseService = null;
  assert.deepEqual(await (await localiser({ latitude: 45.5, longitude: -73.6 })).json(), { ok: false, erreur: "hors-de-france" });
  reponseService = "panne";
  const reponse = await localiser({ latitude: 43.6, longitude: 3.9 });
  assert.equal(reponse.status, 502);
  assert.deepEqual(await reponse.json(), { ok: false, erreur: "service-indisponible" });
});

test("au-delà de 20 demandes en 10 minutes, le même visiteur reçoit 429", async () => {
  const statuts = [];
  for (let i = 0; i < 22; i++) statuts.push((await localiser({ latitude: 43.6, longitude: 3.9 }, "198.51.100.200")).status);
  assert.deepEqual(statuts.slice(18), [200, 200, 429, 429]);
});
