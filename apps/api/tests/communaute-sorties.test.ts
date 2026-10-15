import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerBancCommunaute, HEURE, JOUR } from "./outils/creer-banc-communaute.ts";

let b: Awaited<ReturnType<typeof creerBancCommunaute>>;
before(async () => {
  b = await creerBancCommunaute();
});
after(() => b.banc.fermer());

const sortie = (p: { demander: (m: string, c: string, corps?: unknown) => Promise<{ statut: number; corps: any }> }, id: string) => p.demander("GET", `/app/communaute/sorties/${id}`);

test("organiser : un lieu publié, 6 places au plus, un public dont on fait partie, 5 sorties à venir", async () => {
  const lea = await b.banc.creerPersonne({ prenom: "Léa" });
  const lieu = b.lieu();
  const corps = { ...b.nouvelleSortie(lieu), idClient: randomUUID() };
  const cree = await lea.demander("POST", "/app/communaute/sorties", corps);
  assert.equal(cree.statut, 201);
  const s = cree.corps.sortie;
  assert.equal(s.moi.place, "organisateur");
  assert.equal(s.places, 6);
  assert.deepEqual(s.participants.map((p: { personne: { id: string } }) => p.personne.id), [lea.idPublic]);
  assert.deepEqual(s.etiquettes, [{ nom: "Fans de ramen", officielle: false }, { nom: "Végétarien", officielle: true }]);
  assert.equal(typeof s.conversationId, "string");
  assert.deepEqual(b.membres(s.conversationId), [lea.compteId]);
  const rejouee = await lea.demander("POST", "/app/communaute/sorties", corps);
  assert.deepEqual([rejouee.statut, rejouee.corps.sortie.id], [200, s.id]);

  assert.equal((await b.organiser(lea, b.nouvelleSortie(b.lieu({ statut: "brouillon" })))).corps.erreur, "lieu-inconnu");
  assert.deepEqual((await b.organiser(lea, b.nouvelleSortie(lieu, { places: 7 }))).corps, { ok: false, erreur: "champ-invalide", champ: "places" });
  const reservee = await b.organiser(lea, b.nouvelleSortie(lieu, { public: { type: "genre", genre: "femme" } }));
  assert.deepEqual([reservee.statut, reservee.corps.erreur], [403, "public-reserve"]);
  const injure = await b.organiser(lea, b.nouvelleSortie(lieu, { etiquettes: [{ nom: "Mojito à volonté", officielle: false }] }));
  assert.deepEqual([injure.statut, injure.corps.champ], [400, "etiquettes"]);
  const ines = await b.banc.creerPersonne();
  for (let i = 0; i < 5; i++) assert.equal((await b.organiser(ines, b.nouvelleSortie(lieu))).statut, 201);
  assert.deepEqual((await b.organiser(ines, b.nouvelleSortie(lieu))).corps.erreur, "trop-de-sorties-miamis");
});

test("demander, accepter, refuser : l'organisateur décide de chaque arrivée, et un refus ne se voit pas", async () => {
  const [orga, sam, nina] = [await b.banc.creerPersonne({ prenom: "Orga" }), await b.banc.creerPersonne({ prenom: "Sam" }), await b.banc.creerPersonne()];
  const s = (await b.organiser(orga, b.nouvelleSortie(b.lieu()))).corps.sortie;
  const demande = await sam.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  assert.deepEqual([demande.statut, demande.corps.sortie.moi.place, demande.corps.sortie.conversationId], [200, "demande", null]);
  assert.ok(b.clocheDe(orga).includes("demande-sortie-miamis"));
  const vueOrga = (await sortie(orga, s.id)).corps.sortie;
  assert.deepEqual(vueOrga.demandes.map((d: { personne: { id: string } }) => d.personne.id), [sam.idPublic]);
  assert.deepEqual((await sortie(sam, s.id)).corps.sortie.demandes, []);
  assert.equal((await nina.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${sam.idPublic}`)).corps.erreur, "sortie-inconnue");

  const acceptee = await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${sam.idPublic}`);
  assert.equal(acceptee.statut, 200);
  const vueSam = (await sortie(sam, s.id)).corps.sortie;
  assert.equal(vueSam.moi.place, "accepte");
  assert.deepEqual(b.membres(vueSam.conversationId), [orga.compteId, sam.compteId].sort((x, y) => x - y));
  assert.ok(b.clocheDe(sam).includes("arrivee-acceptee"));
  await b.banc.attendreEnvois();
  assert.ok(b.banc.pushs.some((p) => p.compteId === sam.compteId && p.message.lien === `/potes/miamis/sortie/${s.id}`));

  await nina.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  const avant = b.clocheDe(orga).length;
  assert.equal((await orga.demander("DELETE", `/app/communaute/sorties/${s.id}/demandes/${nina.idPublic}`)).statut, 200);
  assert.equal((await sortie(nina, s.id)).corps.sortie.moi.place, "demande");
  assert.equal((await nina.demander("POST", `/app/communaute/sorties/${s.id}/demande`)).corps.sortie.moi.place, "demande");
  assert.equal(b.clocheDe(orga).length, avant, "un refusé qui redemande ne prévient personne");
  assert.equal((await nina.demander("DELETE", `/app/communaute/sorties/${s.id}/demande`)).corps.sortie.moi.place, "aucune");
  assert.equal((await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${nina.idPublic}`)).corps.erreur, "demande-inconnue");
  assert.equal((await sam.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${nina.idPublic}`)).corps.erreur, "reserve-a-l-organisateur");

  const parti = await sam.demander("DELETE", `/app/communaute/sorties/${s.id}/participation`);
  assert.deepEqual([parti.corps.sortie.moi.place, parti.corps.sortie.conversationId], ["aucune", null]);
  assert.deepEqual(b.membres(vueSam.conversationId), [orga.compteId]);
});

test("6 places au plus et liste d'attente : la première personne en attente entre dès qu'une place se libère", async () => {
  const orga = await b.banc.creerPersonne();
  const [a, c, d, e] = [await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  const s = (await b.organiser(orga, b.nouvelleSortie(b.lieu(), { places: 3 }))).corps.sortie;
  for (const p of [a, c, d, e]) await p.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  for (const p of [a, c, d, e]) await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${p.idPublic}`);
  const vue = (await sortie(orga, s.id)).corps.sortie;
  assert.equal(vue.participants.length, 3);
  assert.equal(vue.nombreEnAttente, 2);
  assert.deepEqual(vue.listeAttente.map((p: { id: string }) => p.id), [d.idPublic, e.idPublic]);
  assert.deepEqual((await sortie(e, s.id)).corps.sortie.moi, { place: "attente", rangAttente: 2, present: false });
  assert.deepEqual((await sortie(e, s.id)).corps.sortie.listeAttente, []);
  assert.ok(b.clocheDe(d).includes("liste-attente-miamis"));

  await a.demander("DELETE", `/app/communaute/sorties/${s.id}/participation`);
  assert.equal((await sortie(d, s.id)).corps.sortie.moi.place, "accepte");
  assert.ok(b.clocheDe(d).includes("place-liberee-miamis"));
  assert.equal((await sortie(e, s.id)).corps.sortie.moi.rangAttente, 1);
  assert.equal(b.communaute.participations.some((p) => p.sortieId === Number(s.id) && p.compteId === a.compteId), false);

  b.banc.horloge.maintenant += 3 * JOUR - 2 * HEURE;
  await c.demander("DELETE", `/app/communaute/sorties/${s.id}/participation`);
  assert.equal(b.communaute.participations.find((p) => p.sortieId === Number(s.id) && p.compteId === c.compteId)?.statut, "desiste");
  assert.equal((await sortie(e, s.id)).corps.sortie.moi.place, "accepte");
  b.banc.horloge.maintenant -= 3 * JOUR - 2 * HEURE;
});

test("place gardée pour un nouveau : un ancien attend, un nouveau entre", async () => {
  const [orga, ancien, autreAncien, nouveau] = [await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  for (const p of [orga, ancien, autreAncien]) b.vieillir(p);
  const s = (await b.organiser(orga, b.nouvelleSortie(b.lieu(), { places: 3, placeGardeePourNouveau: true }))).corps.sortie;
  for (const p of [ancien, autreAncien, nouveau]) await p.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  for (const p of [ancien, autreAncien, nouveau]) await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${p.idPublic}`);
  const places = Object.fromEntries(await Promise.all([ancien, autreAncien, nouveau].map(async (p) => [p.compteId, (await sortie(p, s.id)).corps.sortie.moi.place])));
  assert.deepEqual(places, { [ancien.compteId]: "accepte", [autreAncien.compteId]: "attente", [nouveau.compteId]: "accepte" });
  const vue = (await sortie(orga, s.id)).corps.sortie;
  assert.equal(vue.participants.find((p: { personne: { id: string } }) => p.personne.id === nouveau.idPublic).nouveau, true);
});

test("présence au QR du comptoir : une visite validée dans le lieu, de 1 h avant à 4 h après", async () => {
  const [orga, sam] = [await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  const lieu = b.lieu();
  const s = (await b.organiser(orga, b.nouvelleSortie(lieu, { quand: b.iso(2 * JOUR) }))).corps.sortie;
  await sam.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${sam.idPublic}`);
  assert.equal((await sam.demander("POST", `/app/communaute/sorties/${s.id}/presence`)).corps.erreur, "presence-fermee");
  const debut = Date.parse(s.quand);
  b.banc.horloge.maintenant = debut + 30 * 60_000;
  assert.equal((await sam.demander("POST", `/app/communaute/sorties/${s.id}/presence`)).corps.erreur, "presence-non-validee");
  b.communaute.visites.push({ compteId: sam.compteId, lieuId: lieu + 1, statut: "validee", creeLe: new Date(b.banc.horloge.maintenant), valideLe: new Date(b.banc.horloge.maintenant) });
  assert.equal((await sam.demander("POST", `/app/communaute/sorties/${s.id}/presence`)).corps.erreur, "presence-non-validee", "pas le bon lieu");
  b.communaute.visites.push({ compteId: sam.compteId, lieuId: lieu, statut: "validee", creeLe: new Date(b.banc.horloge.maintenant), valideLe: new Date(b.banc.horloge.maintenant) });
  const present = await sam.demander("POST", `/app/communaute/sorties/${s.id}/presence`);
  assert.equal(present.corps.sortie.moi.present, true);
  assert.equal(present.corps.sortie.participants.find((p: { personne: { id: string } }) => p.personne.id === sam.idPublic).present, true);
  b.banc.horloge.maintenant = Date.parse("2026-10-14T10:00:00Z");
});

test("annuler : la sortie disparaît pour tout le monde, la discussion part, la cloche prévient", async () => {
  const [orga, sam, nina] = [await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  const s = (await b.organiser(orga, b.nouvelleSortie(b.lieu()))).corps.sortie;
  await sam.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${sam.idPublic}`);
  await nina.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  assert.equal((await sam.demander("DELETE", `/app/communaute/sorties/${s.id}`)).corps.erreur, "reserve-a-l-organisateur");
  assert.equal((await orga.demander("DELETE", `/app/communaute/sorties/${s.id}`)).statut, 200);
  assert.equal((await sortie(sam, s.id)).statut, 404);
  assert.equal(b.banc.tables.conversations.has(Number(s.conversationId)), false);
  assert.ok(b.clocheDe(sam).includes("sortie-miamis-annulee") && b.clocheDe(nina).includes("sortie-miamis-annulee"));
});

test("compte limité : 403 pour organiser et demander à venir ; quitter, accepter et annuler passent", async () => {
  const [orga, sam] = [await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  const s = (await b.organiser(orga, b.nouvelleSortie(b.lieu()))).corps.sortie;
  b.limites.add(sam.compteId);
  assert.deepEqual((await sam.demander("POST", `/app/communaute/sorties/${s.id}/demande`)).corps, { ok: false, erreur: "compte-limite", details: { jusqua: null } });
  assert.equal((await b.organiser(sam, b.nouvelleSortie(b.lieu()))).statut, 403);
  b.limites.delete(sam.compteId);
  await sam.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  b.limites.add(orga.compteId);
  assert.equal((await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${sam.idPublic}`)).statut, 200);
  b.limites.add(sam.compteId);
  assert.equal((await sam.demander("DELETE", `/app/communaute/sorties/${s.id}/participation`)).statut, 200);
  assert.equal((await orga.demander("DELETE", `/app/communaute/sorties/${s.id}`)).statut, 200);
  b.limites.clear();
});
