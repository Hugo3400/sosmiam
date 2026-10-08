// Tests de la lecture publique des lieux, avec un faux service : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import type { LieuPublic } from "../src/services/lieux-publics.ts";

let lieux: LieuPublic[] | "panne" = [];
let adresse = "";
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  listerLieuxPublics: async () => {
    if (lieux === "panne") throw new Error("base indisponible");
    return lieux;
  },
}).listen(0, "127.0.0.1");

before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
beforeEach(() => {
  lieux = [];
});

test("sans lieu publié, la liste est vide (et ce n'est pas une erreur)", async () => {
  const reponse = await fetch(`${adresse}/lieux`);
  assert.equal(reponse.status, 200);
  assert.deepEqual(await reponse.json(), { ok: true, lieux: [] });
});

test("les lieux publiés sont renvoyés tels que le service les donne", async () => {
  lieux = [{ id: 3, nom: "Le Petit Comptoir", type: "resto", emoji: "🍲", info: "Bistrot", quartier: "Écusson", ville: "Montpellier",
    prix: "€€", couleurs: ["#FF6B5B", "#C9184A"], decouvertPar: "Léa" }];
  assert.deepEqual(await (await fetch(`${adresse}/lieux`)).json(), { ok: true, lieux });
});

test("si la base est en panne, la réponse reste sobre (500)", async () => {
  lieux = "panne";
  const erreurs = console.error;
  console.error = () => {};
  const reponse = await fetch(`${adresse}/lieux`);
  console.error = erreurs;
  assert.equal(reponse.status, 500);
  assert.deepEqual(await reponse.json(), { ok: false, erreur: "erreur-serveur" });
});
