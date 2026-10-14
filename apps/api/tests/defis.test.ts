// Tests des défis de l'app (GET /app/defis) et des badges automatiques, avec comptes, sessions et défis en mémoire : aucune
// base de données. Mesures, période et heure de Paris, crédit unique, reprise avant la fin, réussite acquise après la fin,
// rattrapage, badges. La gestion (services du logiciel) et l'emballage d'ajouterPoints sont dans defis-gestion.test.ts.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, test } from "node:test";

import type { VisiteDefi } from "../../../packages/commun/src/types/defi.ts";
import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { LIMITE_DEFIS } from "../src/routes/defis.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerDefisEnMemoire } from "../src/services/defis-en-memoire.ts";

// Mercredi 14 octobre 2026, 12 h à Paris
const MIDI_14 = Date.parse("2026-10-14T10:00:00Z");
const banc = { horloge: MIDI_14 };
const memoire = creerComptesEnMemoire(() => banc.horloge);
const points: { compteId: number; points: number; raison: string; detail: string }[] = [];
const badgesDonnes: { compteId: number; badge: string }[] = [];
const defis = creerDefisEnMemoire({
  ajouterPoints: async (compteId, n, raison, detail) => void points.push({ compteId, points: n, raison, detail }),
  donnerBadge: async (compteId, badge) => void badgesDonnes.push({ compteId, badge }),
});
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro, horloge: () => banc.horloge },
  defisApp: { services: defis.services },
}).listen(0, "127.0.0.1");
let adresse = "";

before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

let numero = 0;
async function creerCompte() {
  const id = await memoire.services.creerCompte({ email: `defis${++numero}@exemple.fr`, motDePasse: "empreinte", prenom: "Léa", ville: "Montpellier", quartier: null, cguVersion: "2026-10-08", espace: "app" });
  if (typeof id !== "number") throw new Error("compte de test impossible");
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge });
  return { id, jeton };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function lireDefis(jeton?: string): Promise<{ statut: number; corps: any; entetes: Headers }> {
  const reponse = await fetch(`${adresse}/app/defis`, { headers: { "X-IP-Visiteur": `v-${Math.random()}`, ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) } });
  return { statut: reponse.status, corps: await reponse.json(), entetes: reponse.headers };
}

/** Crée un défi publié (les champs donnés remplacent ceux d'un défi de rescousses) et rend son id */
async function poserDefi(retouches: Record<string, unknown> = {}) {
  const r = await defis.services.creer({
    emoji: "🛟", titre: "La Brigade", texte: "Des rescousses, encore des rescousses.", mesure: "rescousses", objectif: 2, points: 30, debut: "2026-10-14",
    fin: null, publie: true, ...retouches,
  });
  if (!r.ok) throw new Error(`défi de test refusé : ${JSON.stringify(r)}`);
  return r.defi.id;
}
const visite = (iso: string, v: Partial<VisiteDefi> = {}): VisiteDefi => ({ le: Date.parse(iso), lieuId: 1, typeLieu: "resto", ville: "Montpellier", pendantSos: false, ...v });

beforeEach(() => {
  banc.horloge = MIDI_14;
  defis.defis.clear();
  defis.reussites.length = 0;
  defis.faits.clear();
  defis.badges.clear();
  points.length = 0;
  badgesDonnes.length = 0;
});

test("sans session : 401 ; avec session : défis publiés seulement, triés, jamais en cache", async () => {
  assert.equal((await lireDefis()).statut, 401);
  const { jeton } = await creerCompte();
  const globe = await poserDefi({ emoji: "🧭", titre: "Globe-croqueur", mesure: "lieux-differents", objectif: 5, points: 50, ordre: 3 });
  const brigade = await poserDefi({ ordre: 2, fin: "2026-11-30" });
  await poserDefi({ titre: "Brouillon", publie: false, ordre: 1 });
  const bientot = await poserDefi({ titre: "Bientôt", debut: "2026-11-01", ordre: 2 });
  const { statut, corps, entetes } = await lireDefis(jeton);
  assert.equal(statut, 200);
  assert.equal(entetes.get("cache-control"), "private, no-store");
  // Ordre, puis premier jour
  assert.deepEqual(corps.defis.map((d: { id: number }) => d.id), [brigade, bientot, globe]);
  assert.deepEqual(corps.defis[0], {
    id: brigade, emoji: "🛟", titre: "La Brigade", texte: "Des rescousses, encore des rescousses.", objectif: 2, fait: 0, points: 30,
    debut: "2026-10-14", fin: "2026-11-30", etat: "en-cours", reussiLe: null,
  });
  assert.equal(corps.defis[1].etat, "a-venir");
});

test("mesures et filtres : chaque défi compte ce qu'il doit", async () => {
  const { id, jeton } = await creerCompte();
  const ids = {
    premiers: await poserDefi({ mesure: "premiers-sauvetages", objectif: 3 }),
    rescousses: await poserDefi({ objectif: 9 }),
    lieux: await poserDefi({ mesure: "lieux-differents", objectif: 5 }),
    patisseries: await poserDefi({ mesure: "lieux-differents", filtres: { typesLieu: ["patisserie"] }, objectif: 3 }),
    sorties: await poserDefi({ mesure: "lieux-differents", filtres: { typesLieu: ["sortie"] }, objectif: 2 }),
    sos: await poserDefi({ mesure: "visites", filtres: { pendantSos: true }, objectif: 2 }),
    avisPhoto: await poserDefi({ mesure: "avis", filtres: { avecPhoto: true }, objectif: 3 }),
    semaines: await poserDefi({ mesure: "semaines-d-affilee", objectif: 4 }),
    villes: await poserDefi({ mesure: "villes-differentes", objectif: 4 }),
  };
  banc.horloge = Date.parse("2026-10-30T10:00:00Z");
  const f = defis.faitsDe(id);
  f.rescousses.push(Date.parse("2026-10-14T09:00:00Z"), Date.parse("2026-10-20T09:00:00Z"));
  f.premiersSauvetages.push(Date.parse("2026-10-20T09:00:00Z"));
  f.visites.push(
    visite("2026-10-14T11:00:00Z", { lieuId: 1, typeLieu: "patisserie", pendantSos: true }),
    visite("2026-10-15T11:00:00Z", { lieuId: 1, typeLieu: "patisserie" }),
    visite("2026-10-21T18:00:00Z", { lieuId: 3, typeLieu: "sortie", ville: "Sète" }),
    visite("2026-10-28T11:00:00Z", { lieuId: 4, typeLieu: "resto", ville: "Lyon", pendantSos: true }),
  );
  f.avis.push({ le: Date.parse("2026-10-16T10:00:00Z"), avecPhoto: true }, { le: Date.parse("2026-10-17T10:00:00Z"), avecPhoto: false });
  const { corps } = await lireDefis(jeton);
  const fait = (defiId: number) => corps.defis.find((d: { id: number }) => d.id === defiId)?.fait;
  assert.deepEqual(Object.fromEntries(Object.entries(ids).map(([nom, defiId]) => [nom, fait(defiId)])), {
    premiers: 1, rescousses: 2, lieux: 3, patisseries: 1, sorties: 1, sos: 2, avisPhoto: 1, semaines: 3, villes: 3,
  });
  // Le défi des SOS est réussi (2 sur 2) : ses points, une fois
  assert.deepEqual(points, [{ compteId: id, points: 30, raison: "defi", detail: `defi:${ids.sos}` }]);
});

test("période et heure de Paris : premier et dernier jour compris, minuit à Paris, changement d'heure compris", async () => {
  const { id, jeton } = await creerCompte();
  const defiId = await poserDefi({ debut: "2026-10-20", fin: "2026-10-25", objectif: 5 });
  defis.faitsDe(id).rescousses.push(
    Date.parse("2026-10-19T21:30:00Z"), // 19 octobre, 23 h 30 à Paris : avant
    Date.parse("2026-10-19T22:30:00Z"), // 20 octobre, 0 h 30 : dedans
    Date.parse("2026-10-25T21:30:00Z"), // 25 octobre, 22 h 30 (heure d'hiver) : dedans
    Date.parse("2026-10-25T23:30:00Z"), // 26 octobre, 0 h 30 : après
  );
  // 19 octobre, 23 h 59 à Paris : à venir ; une minute plus tard, en cours
  banc.horloge = Date.parse("2026-10-19T21:59:00Z");
  assert.deepEqual((await lireDefis(jeton)).corps.defis.map((d: { etat: string; fait: number }) => [d.etat, d.fait]), [["a-venir", 0]]);
  banc.horloge = Date.parse("2026-10-19T22:00:00Z");
  assert.equal((await lireDefis(jeton)).corps.defis[0].etat, "en-cours");
  banc.horloge = Date.parse("2026-10-25T22:59:00Z"); // 25 octobre, 23 h 59 : encore en cours
  const avant = (await lireDefis(jeton)).corps.defis[0];
  assert.deepEqual([avant.id, avant.etat, avant.fait], [defiId, "en-cours", 2]);
  banc.horloge = Date.parse("2026-10-25T23:00:00Z"); // 26 octobre, minuit : fini sans être réussi, plus montré
  assert.deepEqual((await lireDefis(jeton)).corps.defis, []);
  assert.equal(points.length, 0);
});

test("crédit unique : réussi une fois, points crédités une seule fois (et montrés tels quels), même relu ou recompté en même temps", async () => {
  const { id, jeton } = await creerCompte();
  const defiId = await poserDefi({ fin: "2026-11-30" });
  defis.faitsDe(id).rescousses.push(MIDI_14, MIDI_14 + 60_000);
  await Promise.all([defis.services.reevaluer(id, new Date(banc.horloge)), defis.services.reevaluer(id, new Date(banc.horloge))]);
  const { corps } = await lireDefis(jeton);
  assert.deepEqual(corps.defis[0], {
    ...corps.defis[0], fait: 2, etat: "reussi", reussiLe: new Date(MIDI_14).toISOString(),
  });
  await lireDefis(jeton);
  assert.deepEqual(points, [{ compteId: id, points: 30, raison: "defi", detail: `defi:${defiId}` }]);
  // Une troisième rescousse ne change rien : l'objectif est atteint
  defis.faitsDe(id).rescousses.push(MIDI_14 + 120_000);
  assert.deepEqual(await defis.services.reevaluer(id, new Date(banc.horloge)), { reussis: [], repris: [], badges: [] });
  assert.equal(points.length, 1);
  assert.deepEqual(badgesDonnes, [{ compteId: id, badge: "premiere-rescousse" }]);
  // L'équipe passe ensuite le défi à 50 points : la carte montre toujours les 30 crédités
  await defis.services.modifier(defiId, { points: 50 });
  assert.equal((await lireDefis(jeton)).corps.defis[0].points, 30);
  // Un autre compte a son propre défi
  const autre = await creerCompte();
  assert.equal((await lireDefis(autre.jeton)).corps.defis[0].etat, "en-cours");
});

test("reprise avant la fin : l'avancée retombe (rescousse reprise), la réussite part avec ses points, puis revient", async () => {
  const { id, jeton } = await creerCompte();
  const defiId = await poserDefi({ fin: "2026-11-30", points: 30 });
  const rescousses = defis.faitsDe(id).rescousses;
  rescousses.push(MIDI_14, MIDI_14 + 60_000);
  await lireDefis(jeton);
  // Le Miami reprend une rescousse ; entre-temps, l'équipe a passé le défi à 50 points : on reprend les 30 crédités
  await defis.services.modifier(defiId, { points: 50 });
  rescousses.pop();
  assert.deepEqual(await defis.services.reevaluer(id, new Date(banc.horloge)), { reussis: [], repris: [defiId], badges: [] });
  const retombe = (await lireDefis(jeton)).corps.defis[0];
  assert.deepEqual([retombe.fait, retombe.etat, retombe.reussiLe, retombe.points], [1, "en-cours", null, 50]);
  rescousses.push(MIDI_14 + 120_000);
  await lireDefis(jeton);
  assert.deepEqual(points.map((p) => [p.points, p.detail]), [[30, `defi:${defiId}`], [-30, `defi:${defiId} retiré`], [50, `defi:${defiId}`]]);
});

test("après la fin : une réussite reste acquise ; rattrapage de 7 jours pour un défi pas encore recompté", async () => {
  const { id, jeton } = await creerCompte();
  const brigade = await poserDefi({ fin: "2026-10-20" });
  const plume = await poserDefi({ titre: "Plume", mesure: "avis", objectif: 1, points: 20, fin: "2026-10-20" });
  defis.faitsDe(id).rescousses.push(MIDI_14, MIDI_14 + 60_000);
  await defis.services.reevaluer(id, new Date(banc.horloge));
  // Le 21 octobre, la rescousse est reprise (même semaine) : le défi est fini, la réussite reste
  banc.horloge = Date.parse("2026-10-21T10:00:00Z");
  defis.faitsDe(id).rescousses.pop();
  assert.deepEqual(await defis.services.reevaluer(id, new Date(banc.horloge)), { reussis: [], repris: [], badges: [] });
  // Un avis écrit le dernier soir (20 octobre, 22 h à Paris), relu dans l'app 3 jours plus tard : crédité quand même
  defis.faitsDe(id).avis.push({ le: Date.parse("2026-10-20T20:00:00Z"), avecPhoto: false });
  banc.horloge = Date.parse("2026-10-23T10:00:00Z");
  const { corps } = await lireDefis(jeton);
  assert.deepEqual(corps.defis.map((d: { id: number; etat: string }) => [d.id, d.etat]), [[brigade, "reussi"], [plume, "reussi"]]);
  assert.deepEqual(points.map((p) => p.detail), [`defi:${brigade}`, `defi:${plume}`]);

  // Un autre compte : avis écrit après la fin (ne compte pas), puis un avis dans la période relu 8 jours après la fin
  const autre = await creerCompte();
  defis.faitsDe(autre.id).avis.push({ le: Date.parse("2026-10-21T08:00:00Z"), avecPhoto: false });
  assert.deepEqual((await lireDefis(autre.jeton)).corps.defis, []);
  defis.faitsDe(autre.id).avis.push({ le: Date.parse("2026-10-19T08:00:00Z"), avecPhoto: false });
  banc.horloge = Date.parse("2026-10-28T10:00:00Z");
  assert.deepEqual((await lireDefis(autre.jeton)).corps.defis, []);
  banc.horloge = Date.parse("2026-10-27T10:00:00Z"); // 7 jours après la fin : encore rattrapé
  assert.equal((await lireDefis(autre.jeton)).corps.defis[0].etat, "reussi");
});

test("badges automatiques : donnés une fois, jamais retirés, jamais de points ; Noctambule après 22 h dans tous les lieux", async () => {
  const { id, jeton } = await creerCompte();
  const f = defis.faitsDe(id);
  // Deux visites après 22 h (dont un bar), une à 21 h 30 : pas encore Noctambule
  f.visites.push(visite("2026-10-14T20:30:00Z", { typeLieu: "bar" }), visite("2026-10-15T22:30:00Z"), visite("2026-10-16T19:30:00Z"));
  await lireDefis(jeton);
  assert.equal(badgesDonnes.length, 0);
  f.visites.push(visite("2026-10-17T01:00:00Z", { typeLieu: "sortie" })); // 3 h du matin
  assert.deepEqual(await defis.services.reevaluer(id, new Date(banc.horloge)), { reussis: [], repris: [], badges: ["noctambule"] });
  await defis.services.reevaluer(id, new Date(banc.horloge));
  f.visites.length = 0;
  await defis.services.reevaluer(id, new Date(banc.horloge));
  assert.deepEqual(badgesDonnes, [{ compteId: id, badge: "noctambule" }]);
  assert.equal(points.length, 0);

  // Les autres : première rescousse, bec sucré (5 visites en pâtisserie), explorateur (5 villes), 4 semaines d'affilée
  const autre = await creerCompte();
  const g = defis.faitsDe(autre.id);
  g.rescousses.push(MIDI_14);
  const lundis = ["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02"];
  for (const [i, ville] of ["Montpellier", "Sète", "Lyon", "Nantes", "Lille"].entries()) {
    g.visites.push(visite(`${lundis[i]}T10:00:00Z`, { typeLieu: "patisserie", ville, lieuId: i }));
  }
  await defis.services.reevaluer(autre.id, new Date("2026-11-03T10:00:00Z"));
  assert.deepEqual(badgesDonnes.filter((b) => b.compteId === autre.id).map((b) => b.badge).sort(), ["bec-sucre", "explorateur", "premiere-rescousse", "serie-4"]);
});

test("limite par compte : au-delà de LIMITE_DEFIS lectures en 10 minutes, 429", async () => {
  const { jeton } = await creerCompte();
  for (let i = 0; i < LIMITE_DEFIS.maximum; i++) assert.equal((await lireDefis(jeton)).statut, 200);
  const trop = await lireDefis(jeton);
  assert.equal(trop.statut, 429);
  assert.equal(trop.corps.erreur, "trop-de-demandes");
});
