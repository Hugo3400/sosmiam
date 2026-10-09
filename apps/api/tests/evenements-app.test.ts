// Tests des événements dans l'app (/app/evenements) : dates visibles (Explorer, fiche du lieu), visibilité (suspendu, annulé,
// lieu non publié ou non vérifié), « Ça m'intéresse », mineurs et alcool.
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import type { ChampsEvenement } from "../src/services/evenements-regles.ts";
import { creerBancEvenements, LIEU_TEST } from "./outils/creer-banc-evenements.ts";

let b: Awaited<ReturnType<typeof creerBancEvenements>>;
before(async () => { b = await creerBancEvenements(); });
after(() => b.fermer());
beforeEach(() => {
  b.vider();
  // Le lieu 2 est à Paris
  b.evenements.lieux.set(2, { ...LIEU_TEST, id: 2, nom: "Le Comptoir", ville: "Paris", latitude: 48.8566, longitude: 2.3522 });
});

/** Un événement publié directement dans les données, le `jour` d'octobre (ou de novembre au-delà de 31) à 20 h (Paris) */
async function publier(lieuId: number, jour: number, enPlus: Partial<ChampsEvenement> = {}) {
  const debut = new Date(Date.UTC(2026, 9, jour, 18));
  const champs: ChampsEvenement = {
    titre: "Concert de jazz manouche", type: "concert", description: "", debut, fin: null, hebdoJusqua: null,
    tarif: "gratuit", prixCentimes: null, places: null, alcool: false, ...enPlus,
  };
  const r = await b.evenements.services.creer(lieuId, 1, champs, new Date(b.banc.horloge), Infinity);
  if (!r.ok) throw new Error("événement de test impossible");
  return r.id;
}
const ids = (r: { corps: Record<string, any> }) => r.corps.evenements.map((e: { id: number; debut: string }) => `${e.id}@${e.debut.slice(5, 10)}`);
const ZONE_MONTPELLIER = "nord=43.7&sud=43.5&ouest=3.7&est=4";

test("Explorer : les dates de la zone et de la période, dans l'ordre, une ligne par semaine, cache public", async () => {
  const jazz = await publier(1, 12);
  const quiz = await publier(1, 10, { titre: "Quiz du samedi", type: "quiz", hebdoJusqua: new Date("2026-11-30T00:00:00Z") });
  await publier(2, 11);
  // Par défaut : 14 jours à partir de maintenant ; Paris est hors de la zone
  const r = await b.demander("GET", `/app/evenements?${ZONE_MONTPELLIER}`);
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.equal(r.entetes.get("cache-control"), "public, max-age=60");
  assert.deepEqual(ids(r), [`${quiz}@10-10`, `${jazz}@10-12`, `${quiz}@10-17`]);
  assert.deepEqual(r.corps.evenements[1], {
    id: jazz, lieu: { id: 1, nom: "Chez Léa", emoji: "🍝", type: "resto", ville: "Montpellier" }, titre: "Concert de jazz manouche", type: "concert",
    description: "", debut: "2026-10-12T18:00:00.000Z", fin: null, hebdoJusqua: null, tarif: "gratuit", prixCentimes: null, places: null, photo: null, alcool: false,
  });
  // Sans zone : toute la France ; « ce week-end » choisi par l'app
  const weekEnd = await b.demander("GET", "/app/evenements?du=2026-10-09T22:00:00Z&au=2026-10-11T22:00:00Z");
  assert.deepEqual(ids(weekEnd), [`${quiz}@10-10`, "3@10-11"]);
  // Une date commencée reste visible jusqu'à sa fin (3 h sans heure de fin), puis disparaît
  b.banc.horloge = Date.parse("2026-10-10T20:59:00Z");
  assert.deepEqual(ids(await b.demander("GET", "/app/evenements?au=2026-10-11T00:00:00Z")), [`${quiz}@10-10`]);
  b.banc.horloge = Date.parse("2026-10-10T21:00:00Z");
  assert.deepEqual(ids(await b.demander("GET", "/app/evenements?au=2026-10-11T00:00:00Z")), []);
});

test("Explorer : 200 dates au plus, période de 14 jours au plus, zone et période invalides", async () => {
  for (let i = 0; i < 110; i++) await publier(1, 10 + (i % 3), { hebdoJusqua: new Date("2026-12-01T00:00:00Z") });
  assert.equal((await b.demander("GET", "/app/evenements")).corps.evenements.length, 200);
  for (const requete of ["du=2026-10-10T00:00:00Z&au=2026-10-24T00:00:01Z", "du=2026-10-10T00:00:00Z&au=2026-10-10T00:00:00Z", "du=demain", "au=2026-10-12T20:00"]) {
    const r = await b.demander("GET", `/app/evenements?${requete}`);
    assert.deepEqual([r.statut, r.corps.champ], [400, "periode"], requete);
  }
  assert.equal((await b.demander("GET", "/app/evenements?nord=43&sud=44&ouest=3&est=4")).corps.champ, "zone");
  assert.equal((await b.demander("GET", "/app/evenements?nord=44")).corps.champ, "zone");
});

test("visibilité : ni suspendu, ni annulé, ni lieu non publié ou non vérifié", async () => {
  const visible = await publier(1, 12);
  const suspendu = await publier(1, 13);
  const annule = await publier(1, 14);
  const brouillon = await publier(2, 12);
  b.evenements.evenements.find((e) => e.id === suspendu)!.suspendu = true;
  await b.evenements.services.annuler(annule, new Date(b.banc.horloge));
  b.evenements.lieux.get(2)!.publie = false;
  assert.deepEqual(ids(await b.demander("GET", "/app/evenements")), [`${visible}@10-12`]);
  // Un lieu publié mais plus vérifié (plus de compte pro) : ses événements disparaissent aussi
  b.evenements.lieux.get(2)!.publie = true;
  b.evenements.lieux.get(2)!.verifie = false;
  assert.deepEqual(ids(await b.demander("GET", "/app/evenements")), [`${visible}@10-12`]);
  assert.equal(brouillon > 0, true);
});

test("fiche du lieu : ses 20 prochaines dates ; lieu inconnu ou non publié : 404", async () => {
  await publier(1, 12, { hebdoJusqua: new Date("2027-01-05T00:00:00Z") });
  await publier(1, 13, { hebdoJusqua: new Date("2027-01-05T00:00:00Z") });
  await publier(2, 12);
  const r = await b.demander("GET", "/app/evenements/lieux/1");
  assert.equal(r.entetes.get("cache-control"), "public, max-age=60");
  assert.equal(r.corps.evenements.length, 20);
  assert.deepEqual(ids(r).slice(0, 3), ["1@10-12", "2@10-13", "1@10-19"]);
  assert.ok(r.corps.evenements.every((e: { lieu: { id: number } }) => e.lieu.id === 1));
  assert.equal((await b.demander("GET", "/app/evenements/lieux/9")).corps.erreur, "lieu-inconnu");
  b.evenements.lieux.get(2)!.publie = false;
  assert.equal((await b.demander("GET", "/app/evenements/lieux/2")).statut, 404);
  assert.equal((await b.demander("GET", "/app/evenements/lieux/x")).statut, 404);
});

test("Ça m'intéresse : poser, rappel, mes intérêts du plus proche au plus lointain, retirer ; session obligatoire", async () => {
  const lea = await b.creerCompte();
  const loin = await publier(1, 20);
  const proche = await publier(2, 12);
  assert.equal((await b.demander("GET", "/app/evenements/mes-interets")).statut, 401);
  assert.equal((await b.demander("PUT", `/app/evenements/${loin}/interet`, undefined, {})).statut, 401);
  const r = await b.demander("PUT", `/app/evenements/${loin}/interet`, lea.jeton, {});
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  await b.demander("PUT", `/app/evenements/${proche}/interet`, lea.jeton, { rappel: true });
  const mes = (await b.demander("GET", "/app/evenements/mes-interets", lea.jeton)).corps.interets;
  assert.deepEqual(mes.map((i: { evenement: { id: number }; rappel: boolean; annule: boolean }) => [i.evenement.id, i.rappel, i.annule]), [[proche, true, false], [loin, false, false]]);
  // Déjà posé : le rappel change, rien ne double
  const change = await b.demander("PUT", `/app/evenements/${proche}/interet`, lea.jeton, { rappel: false });
  assert.deepEqual(change.corps.interets.map((i: { rappel: boolean }) => i.rappel), [false, false]);
  assert.equal(b.evenements.interets.length, 2);
  assert.equal((await b.demander("PUT", `/app/evenements/${proche}/interet`, lea.jeton, { rappel: "oui" })).corps.champ, "rappel");
  assert.equal((await b.demander("PUT", "/app/evenements/x/interet", lea.jeton, {})).corps.champ, "id");
  const retire = await b.demander("DELETE", `/app/evenements/${proche}/interet`, lea.jeton);
  assert.deepEqual(retire.corps.interets.map((i: { evenement: { id: number } }) => i.evenement.id), [loin]);
  assert.equal((await b.demander("DELETE", `/app/evenements/${proche}/interet`, lea.jeton)).statut, 200);
});

test("Ça m'intéresse : introuvable, annulé (montré « Annulé » jusqu'à sa date), passé", async () => {
  const lea = await b.creerCompte();
  const concert = await publier(1, 12);
  const suspendu = await publier(1, 13);
  b.evenements.evenements.find((e) => e.id === suspendu)!.suspendu = true;
  for (const id of [99, suspendu]) assert.equal((await b.demander("PUT", `/app/evenements/${id}/interet`, lea.jeton, {})).corps.erreur, "evenement-inconnu");
  await b.demander("PUT", `/app/evenements/${concert}/interet`, lea.jeton, { rappel: true });
  await b.evenements.services.annuler(concert, new Date(b.banc.horloge));
  const mes = (await b.demander("GET", "/app/evenements/mes-interets", lea.jeton)).corps.interets;
  assert.deepEqual(mes.map((i: { annule: boolean }) => i.annule), [true]);
  assert.equal((await b.demander("PUT", `/app/evenements/${concert}/interet`, lea.jeton, {})).statut, 404);
  // Après sa date : plus rien
  b.banc.horloge = Date.parse("2026-10-13T08:00:00Z");
  assert.deepEqual((await b.demander("GET", "/app/evenements/mes-interets", lea.jeton)).corps.interets, []);
  // Passé (pas annulé) : 409
  b.banc.horloge = Date.parse("2026-10-09T10:00:00Z");
  const quiz = await publier(1, 11);
  b.banc.horloge = Date.parse("2026-10-11T21:30:00Z");
  const r = await b.demander("PUT", `/app/evenements/${quiz}/interet`, lea.jeton, {});
  assert.deepEqual([r.statut, r.corps.erreur], [409, "evenement-passe"]);
});

test("mineur et alcool : 403 mineur-alcool, jamais dans ses intérêts ; un bar compte comme alcool", async () => {
  const ado = await b.creerCompte({ naissance: "2010-03-01" });
  const majeure = await b.creerCompte({ naissance: "2000-03-01" });
  const duSite = await b.creerCompte();
  const quiz = await publier(1, 12);
  const degustation = await publier(1, 13, { type: "degustation", titre: "Dégustation de vins", alcool: true });
  const motAlcool = await publier(1, 14, { description: "Une pinte offerte au gagnant" });
  b.evenements.lieux.set(3, { ...LIEU_TEST, id: 3, nom: "Le Zinc", type: "bar" });
  const auBar = await publier(3, 15);
  // Dans Explorer, l'alcool est signalé : l'app cache ces lignes aux 15-17 ans
  const liste = (await b.demander("GET", "/app/evenements")).corps.evenements;
  assert.deepEqual(liste.map((e: { id: number; alcool: boolean }) => [e.id, e.alcool]), [[quiz, false], [degustation, true], [motAlcool, true], [auBar, true]]);
  for (const id of [degustation, motAlcool, auBar]) {
    const r = await b.demander("PUT", `/app/evenements/${id}/interet`, ado.jeton, {});
    assert.deepEqual([r.statut, r.corps.erreur], [403, "mineur-alcool"], String(id));
  }
  assert.equal((await b.demander("PUT", `/app/evenements/${quiz}/interet`, ado.jeton, {})).statut, 200);
  for (const compte of [majeure, duSite]) assert.equal((await b.demander("PUT", `/app/evenements/${degustation}/interet`, compte.jeton, {})).statut, 200);
  // L'alcool ajouté après coup : l'événement disparaît des intérêts de l'ado (sans qu'on efface son « Ça m'intéresse »)
  await b.evenements.services.modifier(quiz, { ...b.evenements.evenements.find((e) => e.id === quiz)!, alcool: true });
  assert.deepEqual((await b.demander("GET", "/app/evenements/mes-interets", ado.jeton)).corps.interets, []);
  assert.equal((await b.demander("GET", "/app/evenements/mes-interets", majeure.jeton)).corps.interets.length, 1);
});
