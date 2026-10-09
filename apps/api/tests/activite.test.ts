// Tests de l'activité de l'app (/app/activite), avec comptes, sessions et activité en mémoire : aucune base de données.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { creerActiviteEnMemoire } from "../src/services/activite-en-memoire.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";

// Un mercredi d'octobre 2026, 12 h à Paris
const banc = { horloge: Date.parse("2026-10-07T10:00:00Z") };
const memoire = creerComptesEnMemoire(() => banc.horloge);
const activite = creerActiviteEnMemoire();
const points: { compteId: number; points: number; raison: string }[] = [];
const badges: { compteId: number; badge: string }[] = [];
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro, horloge: () => banc.horloge },
  activiteApp: {
    services: activite.services,
    ajouterPoints: async (compteId, n, raison) => void points.push({ compteId, points: n, raison }),
    donnerBadge: async (compteId, badge) => void badges.push({ compteId, badge }),
  },
}).listen(0, "127.0.0.1");
let adresse = "";

before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

let numero = 0;
async function creerCompte() {
  const id = await memoire.services.creerCompte({ email: `app${++numero}@exemple.fr`, motDePasse: "empreinte", prenom: "Léa", ville: "Montpellier", quartier: null, cguVersion: "2026-10-08", espace: "pro" });
  if (typeof id !== "number") throw new Error("compte de test impossible");
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge });
  return { id, jeton };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reponse = { statut: number; corps: any; entetes: Headers };
async function demander(methode: string, chemin: string, jeton?: string, corps?: unknown): Promise<Reponse> {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: { "X-IP-Visiteur": `v-${Math.random()}`, "Content-Type": "application/json", ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  return { statut: reponse.status, corps: await reponse.json(), entetes: reponse.headers };
}

beforeEach(() => {
  banc.horloge = Date.parse("2026-10-07T10:00:00Z");
  activite.lieux.clear();
  activite.publications.clear();
  activite.rescousses.length = 0;
  activite.premiers.clear();
  points.length = 0;
  badges.length = 0;
  for (let id = 1; id <= 5; id++) activite.lieux.set(id, { publie: true, verifie: true, publieLe: new Date("2026-06-01T10:00:00Z") });
});

test("sans session : 401 ; avec session : l'activité vide, jamais en cache", async () => {
  assert.equal((await demander("GET", "/app/activite")).statut, 401);
  const { jeton } = await creerCompte();
  const { statut, corps, entetes } = await demander("GET", "/app/activite", jeton);
  assert.equal(statut, 200);
  assert.equal(entetes.get("cache-control"), "private, no-store");
  assert.deepEqual(corps.activite, {
    semaine: "2026-S41", restantes: 3, rescoussesSemaine: [], lieuxSauves: [], rescoussesDonnees: 0, rescoussesDuMois: 0,
    premiersSauvetages: [], gardes: [], jaimes: [], masques: [], suivis: [],
  });
});

test("rescousses : 3 par semaine, +2 points chacune, rechargées le lundi à Paris", async () => {
  const { id, jeton } = await creerCompte();
  for (const lieuId of [1, 2, 3]) assert.equal((await demander("POST", "/app/activite/rescousses", jeton, { lieuId })).statut, 201);
  const quatrieme = await demander("POST", "/app/activite/rescousses", jeton, { lieuId: 4 });
  assert.deepEqual([quatrieme.statut, quatrieme.corps.erreur], [409, "plus-de-rescousse"]);
  // Déjà donnée cette semaine : 200, rien ne change (pas de points en plus)
  const encore = await demander("POST", "/app/activite/rescousses", jeton, { lieuId: 1 });
  assert.deepEqual([encore.statut, encore.corps.activite.restantes], [200, 0]);
  assert.deepEqual(points, [1, 2, 3].map(() => ({ compteId: id, points: 2, raison: "rescousse" })));
  // Dimanche 23 h 30 à Paris : toujours la même semaine
  banc.horloge = Date.parse("2026-10-11T21:30:00Z");
  assert.equal((await demander("POST", "/app/activite/rescousses", jeton, { lieuId: 4 })).statut, 409);
  // Lundi 0 h 30 à Paris : rechargées
  banc.horloge = Date.parse("2026-10-11T22:30:00Z");
  const lundi = await demander("POST", "/app/activite/rescousses", jeton, { lieuId: 4 });
  assert.deepEqual([lundi.statut, lundi.corps.activite.semaine, lundi.corps.activite.restantes], [201, "2026-S42", 2]);
  assert.deepEqual(lundi.corps.activite.lieuxSauves, [4, 3, 2, 1]);
  assert.equal(lundi.corps.activite.rescoussesDonnees, 4);
});

test("rescousses refusées : lieu inconnu, non publié, non vérifié, lieuId mal formé", async () => {
  const { jeton } = await creerCompte();
  activite.lieux.set(6, { publie: false, verifie: true, publieLe: null });
  activite.lieux.set(7, { publie: true, verifie: false, publieLe: null });
  for (const [lieuId, statut, erreur] of [[99, 404, "lieu-inconnu"], [6, 404, "lieu-inconnu"], [7, 409, "lieu-non-verifie"]] as const) {
    const r = await demander("POST", "/app/activite/rescousses", jeton, { lieuId });
    assert.deepEqual([r.statut, r.corps.erreur], [statut, erreur], String(lieuId));
  }
  for (const lieuId of ["1", 0, 1.5, null]) {
    const r = await demander("POST", "/app/activite/rescousses", jeton, { lieuId });
    assert.deepEqual([r.statut, r.corps.champ], [400, "lieuId"], String(lieuId));
  }
});

test("premier sauveteur : la toute première rescousse d'un lieu nouveau, +20 et le badge, une seule fois", async () => {
  activite.lieux.set(8, { publie: true, verifie: true, publieLe: new Date("2026-10-01T10:00:00Z") });
  const lea = await creerCompte();
  const sam = await creerCompte();
  const premiere = await demander("POST", "/app/activite/rescousses", lea.jeton, { lieuId: 8 });
  assert.deepEqual([premiere.corps.premierSauveteur, premiere.corps.activite.premiersSauvetages], [true, [8]]);
  assert.deepEqual(points.filter((p) => p.compteId === lea.id).map((p) => [p.points, p.raison]), [[2, "rescousse"], [20, "premier-sauveteur"]]);
  assert.deepEqual(badges, [{ compteId: lea.id, badge: "premier-sauveteur" }]);
  assert.equal((await demander("POST", "/app/activite/rescousses", sam.jeton, { lieuId: 8 })).corps.premierSauveteur, false);
  // Un lieu publié il y a plus de 30 jours n'est plus nouveau
  assert.equal((await demander("POST", "/app/activite/rescousses", sam.jeton, { lieuId: 1 })).corps.premierSauveteur, false);
});

test("reprendre une rescousse : rend la rescousse et ses points, et le titre de premier sauveteur", async () => {
  activite.lieux.set(8, { publie: true, verifie: true, publieLe: new Date("2026-10-01T10:00:00Z") });
  const { id, jeton } = await creerCompte();
  await demander("POST", "/app/activite/rescousses", jeton, { lieuId: 8 });
  const reprise = await demander("DELETE", "/app/activite/rescousses/8", jeton);
  assert.deepEqual([reprise.statut, reprise.corps.activite.restantes, reprise.corps.activite.premiersSauvetages], [200, 3, []]);
  assert.deepEqual(points.filter((p) => p.compteId === id).map((p) => p.points), [2, 20, -2, -20]);
  // Rien à reprendre : 200, rien ne change
  const rien = await demander("DELETE", "/app/activite/rescousses/8", jeton);
  assert.deepEqual([rien.statut, points.length], [200, 4]);
});

test("garder, aimer, masquer, suivre : mettre et retirer, du plus récent au plus ancien", async () => {
  activite.publications.add(30);
  activite.publications.add(31);
  const { jeton } = await creerCompte();
  for (const chemin of ["/app/activite/gardes/2", "/app/activite/gardes/1", "/app/activite/jaimes/30", "/app/activite/masques/31", "/app/activite/suivis/lieux/3", "/app/activite/suivis/createurs/lea.mange"]) {
    assert.equal((await demander("PUT", chemin, jeton)).statut, 200, chemin);
  }
  let a = (await demander("GET", "/app/activite", jeton)).corps.activite;
  assert.deepEqual([a.gardes, a.jaimes, a.masques, a.suivis], [[1, 2], ["30"], ["31"], ["createur:lea.mange", "lieu:3"]]);
  await demander("DELETE", "/app/activite/gardes/2", jeton);
  await demander("DELETE", "/app/activite/jaimes/30", jeton);
  await demander("DELETE", "/app/activite/suivis/createurs/lea.mange", jeton);
  a = (await demander("GET", "/app/activite", jeton)).corps.activite;
  assert.deepEqual([a.gardes, a.jaimes, a.suivis], [[1], [], ["lieu:3"]]);
  // Cibles inconnues ou mal formées
  assert.deepEqual([(await demander("PUT", "/app/activite/gardes/99", jeton)).corps.erreur], ["lieu-inconnu"]);
  assert.deepEqual([(await demander("PUT", "/app/activite/jaimes/99", jeton)).corps.erreur], ["publication-inconnue"]);
  for (const chemin of ["/app/activite/gardes/abc", "/app/activite/inconnu/1", "/app/activite/suivis/createurs/Léa Mange"]) {
    const r = await demander("PUT", chemin, jeton);
    assert.deepEqual([r.statut, r.corps.champ], [400, "cible"], chemin);
  }
  // Retirer une cible inconnue marche toujours
  assert.equal((await demander("DELETE", "/app/activite/gardes/99", jeton)).statut, 200);
});

test("chacun son activité : un compte ne voit jamais celle d'un autre", async () => {
  const lea = await creerCompte();
  const sam = await creerCompte();
  await demander("POST", "/app/activite/rescousses", lea.jeton, { lieuId: 1 });
  await demander("PUT", "/app/activite/gardes/2", lea.jeton);
  const a = (await demander("GET", "/app/activite", sam.jeton)).corps.activite;
  assert.deepEqual([a.rescoussesSemaine, a.gardes, a.restantes], [[], [], 3]);
});
