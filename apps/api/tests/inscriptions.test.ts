// Tests de la route d'inscription, avec un faux service : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import type { NouvelleInscription } from "../src/services/inscriptions.ts";

const enregistrees: NouvelleInscription[] = [];
let enPanne = false;
let adresse = "";
const serveur = creerApplication({
  enregistrerInscription: async (inscription) => {
    if (enPanne) throw new Error("base indisponible");
    enregistrees.push(inscription);
  },
}).listen(0, "127.0.0.1");

before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));
beforeEach(() => {
  enregistrees.length = 0;
  enPanne = false;
});

let visiteur = 0;
/** Chaque appel vient d'un visiteur différent, sauf si on en impose un (pour tester la limite). */
function inscrire(corps: unknown, ip = `203.0.113.${++visiteur}`) {
  return fetch(`${adresse}/inscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-IP-Visiteur": ip },
    body: typeof corps === "string" ? corps : JSON.stringify(corps),
  });
}

test("une inscription valable est enregistrée, nettoyée", async () => {
  const reponse = await inscrire({ email: "  Lea.Martin@Exemple.FR ", ville: "  Montpellier  ", ambassadeur: true, telephone: "android", beta: true });
  assert.equal(reponse.status, 201);
  assert.deepEqual(await reponse.json(), { ok: true });
  assert.deepEqual(enregistrees, [
    { email: "lea.martin@exemple.fr", ville: "Montpellier", ambassadeur: true, telephone: "android", beta: true, source: "site" },
  ]);
});

test("sans ville, sans téléphone ni case cochée : tout reste vide ou faux", async () => {
  await inscrire({ email: "tom@exemple.fr", ambassadeur: "oui", beta: "oui" });
  assert.deepEqual(enregistrees, [{ email: "tom@exemple.fr", ville: null, ambassadeur: false, telephone: null, beta: false, source: "site" }]);
});

test("seuls « iphone » et « android » sont acceptés comme téléphone", async () => {
  for (const telephone of ["iphone", "android", "nokia", "IPHONE", 3, ""]) await inscrire({ email: "ana@exemple.fr", telephone });
  assert.deepEqual(enregistrees.map((inscription) => inscription.telephone), ["iphone", "android", null, null, null, null]);
});

test("une ville trop longue est coupée à 80 caractères", async () => {
  await inscrire({ email: "ana@exemple.fr", ville: "x".repeat(200) });
  assert.equal(enregistrees[0]?.ville?.length, 80);
});

test("une adresse invalide est refusée", async () => {
  for (const email of ["", "pas-une-adresse", "a@b", `${"a".repeat(250)}@exemple.fr`, 42]) {
    const reponse = await inscrire({ email });
    assert.equal(reponse.status, 400);
    assert.deepEqual(await reponse.json(), { ok: false, erreur: "email-invalide" });
  }
  assert.equal(enregistrees.length, 0);
});

test("le champ piège rempli fait croire à un succès sans rien enregistrer", async () => {
  const reponse = await inscrire({ email: "robot@exemple.fr", piege: "http://spam" });
  assert.equal(reponse.status, 201);
  assert.equal(enregistrees.length, 0);
});

test("un corps JSON cassé reçoit 400", async () => {
  const reponse = await inscrire("{pas du json");
  assert.equal(reponse.status, 400);
  assert.deepEqual(await reponse.json(), { ok: false, erreur: "requete-invalide" });
});

test("au-delà de 5 essais en 10 minutes, le même visiteur reçoit 429", async () => {
  const statuts = [];
  for (let i = 0; i < 7; i++) statuts.push((await inscrire({ email: `essai${i}@exemple.fr` }, "198.51.100.7")).status);
  assert.deepEqual(statuts, [201, 201, 201, 201, 201, 429, 429]);
  assert.equal((await inscrire({ email: "autre@exemple.fr" }, "198.51.100.8")).status, 201);
});

test("si la base est en panne, la réponse reste sobre (500)", async () => {
  enPanne = true;
  const erreurs = console.error;
  console.error = () => {};
  const reponse = await inscrire({ email: "panne@exemple.fr" });
  console.error = erreurs;
  assert.equal(reponse.status, 500);
  assert.deepEqual(await reponse.json(), { ok: false, erreur: "erreur-serveur" });
});

test("une adresse inconnue reçoit 404, et /sante répond", async () => {
  assert.equal((await fetch(`${adresse}/nimporte-quoi`)).status, 404);
  assert.deepEqual(await (await fetch(`${adresse}/sante`)).json(), { ok: true });
});
