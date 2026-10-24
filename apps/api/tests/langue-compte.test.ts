import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import express from "express";
import type { Request, Response } from "express";

import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { lireLangueDemande, poserLangue } from "../src/middlewares/poser-langue.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import type { CompteConnecte } from "../src/services/comptes.ts";

const horloge = Date.parse("2026-10-24T10:00:00Z");
const memoire = creerComptesEnMemoire(() => horloge);
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, horloge: () => horloge },
  listerLieuxDuPlan: async () => [{ id: 3, modifieLe: new Date("2026-10-09T08:00:00Z"), indexable: true }],
}).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

type Corps = { ok: boolean; erreur?: string; champ?: string; compte?: CompteConnecte; langue?: string };
let visiteur = 0;
async function demander(methode: string, chemin: string, { corps, jeton, langue }: { corps?: unknown; jeton?: string; langue?: string } = {}) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: {
      "X-IP-Visiteur": `visiteur-${++visiteur}`,
      ...(corps === undefined ? {} : { "Content-Type": "application/json" }),
      ...(jeton ? { "X-Session-Compte": jeton } : {}),
      ...(langue ? { "X-Langue": langue } : {}),
    },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Corps, entetes: reponse.headers };
}

let numero = 0;
function creerDansLaLangue(langue: string | undefined) {
  const requete = { get: (nom: string) => (nom === "X-Langue" ? langue : undefined) } as unknown as Request;
  return new Promise<number>((fini, rate) => {
    poserLangue(requete, {} as Response, () => {
      memoire.services
        .creerCompte({ email: `langue${++numero}@exemple.fr`, motDePasse: "empreinte", prenom: "Camille", ville: "Lyon", quartier: null, cguVersion: "2026-10-15" })
        .then((id) => (id === null ? rate(new Error("compte de test impossible")) : fini(id)), rate);
    });
  });
}
async function ouvrirSession(compteId: number) {
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId, creeLe: horloge, activite: horloge });
  return jeton;
}

test("poserLangue : X-Langue lu pour toute la demande, fr sinon ; hors d'une demande, fr", async () => {
  const essai = express();
  essai.use(poserLangue);
  essai.use(express.json());
  essai.post("/", async (_requete, reponse) => {
    await new Promise((fini) => setTimeout(fini, 2));
    reponse.json({ langue: lireLangueDemande() });
  });
  const ecoute = essai.listen(0, "127.0.0.1");
  await new Promise((pret) => ecoute.once("listening", pret));
  const ici = `http://127.0.0.1:${(ecoute.address() as AddressInfo).port}`;
  const lire = async (entete?: string) =>
    ((await (await fetch(ici, { method: "POST", headers: { "Content-Type": "application/json", ...(entete ? { "X-Langue": entete } : {}) }, body: "{}" })).json()) as { langue: string }).langue;
  try {
    assert.equal(await lire("en"), "en");
    assert.equal(await lire("EN-gb"), "en");
    assert.equal(await lire("fr-FR"), "fr");
    assert.equal(await lire("de"), "fr");
    assert.equal(await lire("n'importe quoi"), "fr");
    assert.equal(await lire(), "fr");
    assert.equal(lireLangueDemande(), "fr");
  } finally {
    await new Promise((fini) => ecoute.close(fini));
  }
});

test("langue du compte : posée à la création par la demande, jamais changée par une simple demande", async () => {
  const anglais = await creerDansLaLangue("en");
  const francais = await creerDansLaLangue(undefined);
  const jetonAnglais = await ouvrirSession(anglais);
  const jetonFrancais = await ouvrirSession(francais);
  assert.equal((await demander("GET", "/comptes/session", { jeton: jetonAnglais })).corps.compte?.langue, "en");
  assert.equal((await demander("GET", "/comptes/session", { jeton: jetonFrancais, langue: "en" })).corps.compte?.langue, "fr");
  await demander("PATCH", "/comptes/moi", { jeton: jetonFrancais, langue: "en", corps: { prenom: "Camille" } });
  assert.equal((await demander("GET", "/comptes/session", { jeton: jetonFrancais })).corps.compte?.langue, "fr");
});

test("PUT /comptes/moi/langue : le seul geste qui change la langue du compte", async () => {
  const id = await creerDansLaLangue(undefined);
  const jeton = await ouvrirSession(id);
  assert.equal((await demander("PUT", "/comptes/moi/langue", { corps: { langue: "en" } })).statut, 401);
  const mauvaise = await demander("PUT", "/comptes/moi/langue", { jeton, corps: { langue: "de" } });
  assert.deepEqual([mauvaise.statut, mauvaise.corps.erreur, mauvaise.corps.champ], [400, "champ-invalide", "langue"]);
  assert.equal((await demander("PUT", "/comptes/moi/langue", { jeton, corps: {} })).statut, 400);
  const changee = await demander("PUT", "/comptes/moi/langue", { jeton, corps: { langue: "en-GB" } });
  assert.deepEqual([changee.statut, changee.corps], [200, { ok: true, langue: "en" }]);
  assert.equal((await demander("GET", "/comptes/session", { jeton, langue: "fr" })).corps.compte?.langue, "en");
  assert.deepEqual((await demander("PUT", "/comptes/moi/langue", { jeton, corps: { langue: "fr" } })).corps, { ok: true, langue: "fr" });
});

test("une réponse publique en cache ne change jamais avec X-Langue (Cloudflare ignore Vary)", async () => {
  const sans = await fetch(`${adresse}/lieux/plan`);
  const avec = await fetch(`${adresse}/lieux/plan`, { headers: { "X-Langue": "en" } });
  assert.equal(await sans.text(), await avec.text());
  assert.equal(sans.headers.get("cache-control"), avec.headers.get("cache-control"));
  assert.equal(avec.headers.get("vary")?.toLowerCase().includes("x-langue") ?? false, false);
});
