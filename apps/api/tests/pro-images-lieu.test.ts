import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";

const horloge = Date.parse("2026-10-25T10:00:00Z");
const memoire = creerComptesEnMemoire(() => horloge);
const appels: unknown[] = [];
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro, horloge: () => horloge },
  imagesLieuPro: {
    envoyer: async (compteId, lieuId, quelle, octets) => (appels.push({ compteId, lieuId, quelle, taille: octets.length }), { ok: true, adresse: `/app/lieux/images/x.${quelle === "logo" ? "png" : "jpg"}` }),
    retirer: async (compteId, lieuId, quelle) => (appels.push({ compteId, lieuId, quelle, retrait: true }), { ok: true, retiree: true }),
    lirePublique: async () => null,
  },
}).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

test("espace pro : bannière et logo passent par la session, puis par le service des images", async () => {
  const id = await memoire.services.creerCompte({ email: "gerant@exemple.fr", motDePasse: "empreinte", prenom: "Gérant", ville: "", quartier: null, cguVersion: "2026-10-15", espace: "pro" });
  assert.ok(id);
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: horloge, activite: horloge });
  const envoyer = (chemin: string, type: string, avecSession = true) =>
    fetch(`${adresse}${chemin}`, { method: "PUT", headers: { "Content-Type": type, "X-IP-Visiteur": "198.51.100.7", ...(avecSession ? { "X-Session-Compte": jeton } : {}) }, body: new Uint8Array(10) });
  assert.equal((await envoyer("/pro/lieux/5/banniere", "image/jpeg", false)).status, 401);
  const banniere = await envoyer("/pro/lieux/5/banniere", "image/jpeg");
  assert.deepEqual([banniere.status, await banniere.json()], [200, { ok: true, adresse: "/app/lieux/images/x.jpg" }]);
  assert.equal((await envoyer("/pro/lieux/5/logo", "image/png")).status, 200);
  const retrait = await fetch(`${adresse}/pro/lieux/5/logo`, { method: "DELETE", headers: { "X-IP-Visiteur": "198.51.100.7", "X-Session-Compte": jeton } });
  assert.equal(retrait.status, 200);
  assert.deepEqual(appels, [
    { compteId: id, lieuId: 5, quelle: "banniere", taille: 10 },
    { compteId: id, lieuId: 5, quelle: "logo", taille: 10 },
    { compteId: id, lieuId: 5, quelle: "logo", retrait: true },
  ]);
});
