// Tests de « Je suis sur place » (POST /espace-ambassadeur/missions/:id/presence) et des champs ajoutés à la liste des
// missions, avec un faux service, sans base. Le compte connecté est posé comme le ferait exigerAmbassadeurActif.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import express from "express";

import type { LecturePosition } from "../../../packages/commun/src/types/position.ts";
import { creerRoutesEspaceAmbassadeur, LIMITE_PRESENCE } from "../src/routes/espace-ambassadeur.ts";
import type { ResultatPresence } from "../src/services/gestion/missions-messages.ts";

const POSITION: LecturePosition = { latitude: 43.6108, longitude: 3.8767, precision: 12, ageMs: 800, simulee: false };
const LIEU = { id: 2, nom: "La Figue Pressée", ville: "Montpellier", emoji: "🍸", position: { latitude: 43.6109, longitude: 3.8768 } };
const MISSION = {
  id: 1, titre: "Vérifier la fiche", detail: "", echeance: null, statut: "a-faire", compteRendu: null, creeLe: new Date("2026-10-10T08:00:00Z"),
  faiteLe: null, type: "verifier-lieu", presenceVerifieeLe: new Date("2026-10-14T13:42:00Z"), lieu: LIEU,
};

/** Ce que rend le faux service, selon le numéro de la mission (le vrai : services/gestion/missions-messages.ts) */
const REPONSES: Record<number, ResultatPresence> = {
  1: { ok: true, mission: MISSION as never },
  3: { ok: false, erreur: "deja-sur-place" },
  4: { ok: false, erreur: "lieu-sans-position" },
  5: { ok: false, erreur: "transition-interdite" },
  6: { ok: false, erreur: "hors-zone", details: { distanceM: 1200, lieu: "La Figue Pressée" } },
  7: { ok: false, erreur: "position-imprecise", details: { precisionM: 180 } },
  8: { ok: false, erreur: "position-perimee" },
  9: { ok: false, erreur: "position-simulee" },
};
const appels: { compteId: number; id: number; position: LecturePosition }[] = [];

const application = express();
application.use(express.json());
// Le compte connecté : 7, ou celui de l'en-tête X-Compte (pour la limite par compte)
application.use((requete, reponse, suite) => {
  reponse.locals.compte = { id: Number(requete.get("x-compte") ?? 7) };
  suite();
});
application.use("/espace-ambassadeur", creerRoutesEspaceAmbassadeur({
  missionsDuCompte: (async () => [MISSION]) as never,
  terminerMission: (async () => true) as never,
  messagesDuCompte: (async () => []) as never,
  marquerMessageLu: (async () => true) as never,
  noterPresence: async (compteId, id, position) => {
    appels.push({ compteId, id, position });
    return REPONSES[id] ?? { ok: false, erreur: "introuvable" };
  },
}));
const serveur = application.listen(0, "127.0.0.1");
let base = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  base = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}/espace-ambassadeur`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

let compteSuivant = 100;
/** Chaque appel prend un nouveau compte (sauf si on le donne) : la limite de 10 par minute ne gêne pas les autres tests */
async function signaler(id: number | string, corps: unknown, compte = compteSuivant++) {
  const reponse = await fetch(`${base}/missions/${id}/presence`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Compte": String(compte) },
    body: JSON.stringify(corps),
  });
  const texte = await reponse.text();
  return { statut: reponse.status, texte, corps: JSON.parse(texte) as Record<string, unknown> };
}

test("missions : type, heure de présence et lieu avec emoji et position, en plus des champs d'avant", async () => {
  const corps = (await (await fetch(`${base}/missions`)).json()) as { ok: boolean; missions: Record<string, unknown>[] };
  assert.equal(corps.ok, true);
  const [mission] = corps.missions;
  for (const champ of ["id", "titre", "detail", "echeance", "statut", "compteRendu", "creeLe", "faiteLe", "lieu"]) assert.ok(champ in mission, champ);
  assert.equal(mission.type, "verifier-lieu");
  assert.equal(mission.presenceVerifieeLe, "2026-10-14T13:42:00.000Z");
  assert.deepEqual(mission.lieu, LIEU);
});

test("sur place : 200 avec la mission relue ; le service reçoit le compte, la mission et la lecture", async () => {
  const r = await signaler(1, { position: POSITION }, 41);
  assert.equal(r.statut, 200);
  assert.equal(r.corps.ok, true);
  assert.equal((r.corps.mission as { presenceVerifieeLe: string }).presenceVerifieeLe, "2026-10-14T13:42:00.000Z");
  assert.deepEqual(appels.at(-1), { compteId: 41, id: 1, position: POSITION });
});

test("position absente ou mal formée : 400 champ-invalide { champ: position }, sans appeler le service", async () => {
  const avant = appels.length;
  const mauvaises: unknown[] = [
    undefined,
    "43.61,3.87",
    { ...POSITION, simulee: undefined },
    { ...POSITION, latitude: 91 },
    { ...POSITION, longitude: "3.8767" },
    { ...POSITION, ageMs: -1 },
    { ...POSITION, precision: -5 },
  ];
  for (const position of mauvaises) {
    const r = await signaler(1, { position });
    assert.equal(r.statut, 400);
    assert.deepEqual(r.corps, { ok: false, erreur: "champ-invalide", champ: "position" });
  }
  assert.equal(appels.length, avant);
});

test("mission absente, d'un autre compte ou numéro illisible : 404 introuvable", async () => {
  assert.deepEqual((await signaler(2, { position: POSITION })).corps, { ok: false, erreur: "introuvable" });
  assert.equal((await signaler(2, { position: POSITION })).statut, 404);
  assert.equal((await signaler("abc", { position: POSITION })).statut, 404);
  assert.equal((await signaler(0, { position: POSITION })).statut, 404);
});

test("refus : 409 pour la mission, 422 pour la position, sans jamais renvoyer la lecture du téléphone", async () => {
  const attendus: [number, number, string][] = [
    [3, 409, "deja-sur-place"], [4, 409, "lieu-sans-position"], [5, 409, "transition-interdite"],
    [6, 422, "hors-zone"], [7, 422, "position-imprecise"], [8, 422, "position-perimee"], [9, 422, "position-simulee"],
  ];
  for (const [id, statut, erreur] of attendus) {
    const r = await signaler(id, { position: POSITION });
    assert.equal(r.statut, statut, erreur);
    assert.equal(r.corps.erreur, erreur);
    assert.ok(!r.texte.includes(String(POSITION.latitude)) && !r.texte.includes(String(POSITION.longitude)), `${erreur} : la position ressort`);
    assert.ok(!/latitude|longitude/.test(r.texte), `${erreur} : des coordonnées ressortent`);
  }
  // Hors zone : la distance arrondie et le nom du lieu, pour le message « environ 1,2 km »
  assert.deepEqual((await signaler(6, { position: POSITION })).corps, { ok: false, erreur: "hors-zone", details: { distanceM: 1200, lieu: "La Figue Pressée" } });
});

test("10 essais par minute et par compte, puis 429 trop-de-demandes ; un autre compte n'est pas gêné", async () => {
  for (let i = 0; i < LIMITE_PRESENCE.maximum; i += 1) assert.equal((await signaler(6, { position: POSITION }, 55)).statut, 422);
  const bloque = await signaler(6, { position: POSITION }, 55);
  assert.equal(bloque.statut, 429);
  assert.deepEqual(bloque.corps, { ok: false, erreur: "trop-de-demandes" });
  assert.equal((await signaler(1, { position: POSITION }, 56)).statut, 200);
});
