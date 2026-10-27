import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import express, { type NextFunction, type Request, type Response } from "express";

import { detecterAlcoolActus } from "../src/fonctions/actus/detecter-alcool-actus.ts";
import { ecrireCurseurActus } from "../src/fonctions/actus/ecrire-curseur-actus.ts";
import { lireCorpsArticleActus, type CorpsArticleActus } from "../src/fonctions/actus/lire-corps-article-actus.ts";
import { lireCurseurActus } from "../src/fonctions/actus/lire-curseur-actus.ts";
import { presenterArticleActus } from "../src/fonctions/actus/presenter-article-actus.ts";
import type { ProtectionComptes } from "../src/middlewares/proteger-comptes.ts";
import { creerRoutesActus } from "../src/routes/actus.ts";
import type { ActusAuteur } from "../src/services/actus-auteur.ts";
import type { ActusLecture, FiltresActus } from "../src/services/actus-lecture.ts";
import type { LigneArticleActus } from "../src/services/actus-regles.ts";
import type { PhotosActus } from "../src/services/photos-actus.ts";

const NOM = "11111111-1111-4111-8111-111111111111.jpg";
const AMBASSADEUR = `Bearer ${"a".repeat(43)}`;
const LEA = `Bearer ${"b".repeat(43)}`;
const CORPS = {
  rubrique: "portrait", titre: "Un titre assez long", accroche: "Une phrase d'accroche bien tournée.", texte: "Un texte.",
  citation: null, couverture: NOM, photos: [], lieux: [3], collaboration: false, finLe: null,
};

test("actus : le corps d'un article est lu tel qu'envoyé, ou refusé s'il a une mauvaise forme", () => {
  assert.deepEqual(lireCorpsArticleActus(CORPS), { ...CORPS, citation: "" });
  assert.equal(lireCorpsArticleActus({ ...CORPS, rubrique: "pub" }), null);
  assert.equal(lireCorpsArticleActus({ ...CORPS, photos: [1] }), null);
  assert.equal(lireCorpsArticleActus({ ...CORPS, photos: [NOM, NOM, NOM, NOM, NOM] }), null);
  assert.equal(lireCorpsArticleActus({ ...CORPS, lieux: ["3"] }), null);
  assert.equal(lireCorpsArticleActus({ ...CORPS, collaboration: "oui" }), null);
  assert.equal(lireCorpsArticleActus({ ...CORPS, texte: "x".repeat(6001) }), null);
  assert.equal(lireCorpsArticleActus([CORPS]), null);
});

test("actus : le curseur d'une page se relit, et rien d'autre", () => {
  const quand = new Date("2026-10-27T10:00:00Z");
  assert.deepEqual(lireCurseurActus(ecrireCurseurActus(quand, 42)), { publieLe: quand, id: 42 });
  for (const faux of ["", "abc", "1.0", "1.-2", 12, null, `${"9".repeat(16)}.1`]) assert.equal(lireCurseurActus(faux), null, String(faux));
});

test("actus : l'alcool est repéré dans un bar cité ou dans le texte", () => {
  const article = { rubrique: "portrait" as const, titre: "Une terrasse", accroche: "Au soleil.", paragraphes: ["Des pâtes fraîches."], citation: null, photos: 0, lieux: [1], collaboration: false, finLe: null };
  assert.equal(detecterAlcoolActus(article, ["resto"]), false);
  assert.equal(detecterAlcoolActus(article, ["resto", "bar"]), true);
  assert.equal(detecterAlcoolActus({ ...article, paragraphes: ["Un verre de vin blanc avec les huîtres."] }, ["resto"]), true);
  assert.equal(detecterAlcoolActus({ ...article, citation: "On sert la meilleure bière du port." }, ["resto"]), true);
});

test("actus : un article se présente sans l'identifiant de l'auteur, avec ses lieux publiés seulement", () => {
  const ligne = {
    id: 7, rubrique: "portrait", titre: "Titre", accroche: "Accroche", texte: "Un.\n\nDeux.", citation: null, couverture: NOM, photos: [NOM],
    collaboration: true, alcool: false, finLe: new Date("2026-11-30T00:00:00Z"), publieLe: new Date("2026-10-27T10:00:00Z"), aLaUne: false,
    auteur: { prenom: "Zoé", avatar: "photo:abc", ambassadeur: { statut: "actif" } },
    lieux: [
      { lieu: { id: 1, nom: "Ouvert", type: "resto", emoji: "🍝", quartier: "Q", ville: "V", statut: "publie", _count: { rattachements: 0 } } },
      { lieu: { id: 2, nom: "Fermé", type: "resto", emoji: "🍝", quartier: "Q", ville: "V", statut: "brouillon", _count: { rattachements: 1 } } },
    ],
    reponses: [{ lieuId: 1, texte: "Merci !", decideLe: new Date("2026-10-28T08:00:00Z"), lieu: { nom: "Ouvert" } }],
  } as unknown as LigneArticleActus;
  const article = presenterArticleActus(ligne, 3, false);
  assert.deepEqual(article.paragraphes, ["Un.", "Deux."]);
  assert.deepEqual(article.auteur, { id: 0, prenom: "Zoé", avatar: null, ambassadeur: true });
  assert.deepEqual(article.lieux.map((l) => l.id), [1]);
  assert.equal(article.couverture, `/app/actus/images/${NOM}`);
  assert.equal(article.finLe, "2026-11-30");
  assert.deepEqual(article.reponsesLieux, [{ lieuId: 1, nomLieu: "Ouvert", texte: "Merci !", repondueLe: "2026-10-28T08:00:00.000Z" }]);
  assert.equal(article.aime, false);
  assert.equal("aime" in presenterArticleActus(ligne, 3), false);
});

const lireJson = async (r: globalThis.Response) => (await r.json()) as Record<string, unknown>;

const appels: { liste: FiltresActus[]; envois: CorpsArticleActus[] } = { liste: [], envois: [] };
let refusEnvoi: { ok: false; erreur: "limite-actus-semaine" } | null = null;

const lecture = {
  lister: async (f: FiltresActus) => (appels.liste.push(f), { articles: [], suivant: null }),
  villes: async () => [],
  lire: async () => null,
  aimer: async () => null,
} as unknown as ActusLecture;
const auteur = {
  envoyer: async (_compteId: number, corps: CorpsArticleActus) => (appels.envois.push(corps), refusEnvoi ?? { ok: true, id: 9 }),
  mesArticles: async () => ({ articles: [], envoyesCetteSemaine: 0 }),
  lireBrouillon: async () => null,
  retoucher: async () => ({ ok: true }),
} as unknown as ActusAuteur;
const photos = { lirePublique: async () => null, lireDuCompte: async () => null, deposer: async () => ({ ok: true, photo: NOM }) } as unknown as PhotosActus;

const ouvrir = (ambassadeur: boolean) => async (requete: Request, reponse: Response, suite: NextFunction) => {
  const jeton = requete.get("authorization");
  if (!jeton) return reponse.status(401).json({ ok: false, erreur: "connexion-requise" });
  if (ambassadeur && jeton !== AMBASSADEUR) return reponse.status(403).json({ ok: false, erreur: "ambassadeur-non-actif" });
  reponse.locals.compte = { id: 5 };
  suite();
};
const protection = { exigerCompte: ouvrir(false), exigerAmbassadeurActif: ouvrir(true) } as unknown as ProtectionComptes;

let adresse = "";
let fermer: () => void = () => {};
before(async () => {
  const app = express().use(express.json()).use("/app/actus", creerRoutesActus({ lecture, auteur, photos }, protection, (_q, _r, suite) => suite()));
  const serveur = app.listen(0);
  await new Promise((fait) => serveur.once("listening", fait));
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  fermer = () => serveur.close();
});
after(() => fermer());
beforeEach(() => {
  appels.liste = [];
  appels.envois = [];
  refusEnvoi = null;
});

test("actus (routes) : sans session, liste publique sans alcool ; avec session, privée et complète", async () => {
  const publique = await fetch(`${adresse}/app/actus?rubrique=portrait&ville=Montpellier`);
  assert.equal(publique.status, 200);
  assert.equal(publique.headers.get("cache-control"), "public, max-age=60");
  assert.deepEqual(appels.liste[0], { rubrique: "portrait", ville: "Montpellier", curseur: null, avecAlcool: false, compteId: null });
  const privee = await fetch(`${adresse}/app/actus`, { headers: { authorization: LEA } });
  assert.equal(privee.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(appels.liste[1], { rubrique: null, ville: null, curseur: null, avecAlcool: true, compteId: 5 });
});

test("actus (routes) : filtres et curseur faux refusés, article inconnu en 404", async () => {
  assert.equal((await lireJson(await fetch(`${adresse}/app/actus?rubrique=pub`))).champ, "rubrique");
  assert.equal((await lireJson(await fetch(`${adresse}/app/actus?curseur=abc`))).champ, "curseur");
  const inconnu = await fetch(`${adresse}/app/actus/12`);
  assert.equal(inconnu.status, 404);
  assert.equal((await lireJson(inconnu)).erreur, "article-introuvable");
});

test("actus (routes) : écrire demande un ambassadeur actif, un corps bien formé, et rend les refus du service", async () => {
  const envoyer = (corps: unknown, jeton = AMBASSADEUR) =>
    fetch(`${adresse}/app/actus`, { method: "POST", headers: { authorization: jeton, "content-type": "application/json" }, body: JSON.stringify(corps) });
  assert.equal((await envoyer(CORPS, LEA)).status, 403);
  const mal = await envoyer({ ...CORPS, rubrique: "pub" });
  assert.deepEqual([mal.status, (await lireJson(mal)).erreur], [400, "article-invalide"]);
  const bon = await envoyer(CORPS);
  assert.deepEqual([bon.status, await lireJson(bon)], [201, { ok: true, id: 9 }]);
  assert.equal(appels.envois[0]?.couverture, NOM);
  refusEnvoi = { ok: false, erreur: "limite-actus-semaine" };
  const limite = await envoyer(CORPS);
  assert.deepEqual([limite.status, (await lireJson(limite)).erreur], [409, "limite-actus-semaine"]);
});

test("actus (routes) : une photo qui n'est pas un JPEG est refusée", async () => {
  const r = await fetch(`${adresse}/app/actus/photos`, { method: "POST", headers: { authorization: AMBASSADEUR, "content-type": "text/plain" }, body: "bonjour" });
  assert.deepEqual([r.status, (await lireJson(r)).erreur], [415, "photo-actus-invalide"]);
});
