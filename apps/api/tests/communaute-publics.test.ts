import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerBancCommunaute, HEURE, JOUR } from "./outils/creer-banc-communaute.ts";
import type { PersonneDeTest } from "./outils/creer-banc-social.ts";

let b: Awaited<ReturnType<typeof creerBancCommunaute>>;
before(async () => {
  b = await creerBancCommunaute();
});
after(() => b.banc.fermer());

const idsDesSorties = async (p: PersonneDeTest) => (await p.demander("GET", "/app/communaute/sorties")).corps.sorties.map((s: { id: string }) => s.id);
const choisirGenre = (p: PersonneDeTest, choix: string) => p.demander("PUT", "/app/communaute/genre", { choix });
function naissance(p: PersonneDeTest, date: string) {
  const compte = b.banc.memoire.comptes.get(p.compteId);
  if (compte && b.banc.chiffrement) compte.dateNaissanceChiffree = b.banc.chiffrement.chiffrer(date, "dateNaissance");
}

test("mon genre : chiffré, une fois par mois, « ne-pas-dire » sans remettre le délai à zéro, effaçable", async () => {
  const lea = await b.banc.creerPersonne();
  assert.deepEqual((await lea.demander("GET", "/app/communaute/genre")).corps.genre, { choix: null, modifieLe: null });
  const choisi = await choisirGenre(lea, "femme");
  assert.deepEqual(choisi.corps.genre, { choix: "femme", modifieLe: new Date(b.banc.horloge.maintenant).toISOString() });
  const chiffre = b.communaute.profils.get(lea.compteId)?.genreChiffre ?? "";
  assert.ok(chiffre.startsWith("v1:") && !chiffre.includes("femme"));
  b.banc.horloge.maintenant += 3 * JOUR;
  const tropTot = await choisirGenre(lea, "homme");
  assert.deepEqual(tropTot.corps, { ok: false, erreur: "genre-trop-tot", details: { jusqua: "2026-11-14T10:00:00.000Z" } });
  const nePasDire = await choisirGenre(lea, "ne-pas-dire");
  assert.deepEqual(nePasDire.corps.genre, { choix: "ne-pas-dire", modifieLe: "2026-10-14T10:00:00.000Z" });
  assert.equal((await choisirGenre(lea, "autre")).corps.erreur, "genre-trop-tot");
  const efface = await lea.demander("DELETE", "/app/communaute/genre");
  assert.deepEqual(efface.corps.genre, { choix: null, modifieLe: "2026-10-14T10:00:00.000Z" });
  assert.equal(b.communaute.profils.get(lea.compteId)?.genreChiffre, null);
  b.banc.horloge.maintenant += 31 * JOUR;
  assert.equal((await choisirGenre(lea, "autre")).corps.genre.choix, "autre");
  assert.deepEqual((await lea.demander("PUT", "/app/communaute/genre", { choix: "mineur" })).corps, { ok: false, erreur: "champ-invalide", champ: "choix" });
  b.banc.horloge.maintenant = Date.parse("2026-10-14T10:00:00Z");
});

test("public « entre filles » : invisible et fermé aux autres, et le genre de personne n'est jamais montré", async () => {
  const [nina, ines, sam, alex] = [await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  await choisirGenre(nina, "femme");
  await choisirGenre(ines, "femme");
  await choisirGenre(sam, "homme");
  const s = (await b.organiser(nina, b.nouvelleSortie(b.lieu(), { public: { type: "genre", genre: "femme" } }))).corps.sortie;
  assert.ok((await idsDesSorties(ines)).includes(s.id));
  for (const autre of [sam, alex]) {
    assert.equal((await idsDesSorties(autre)).includes(s.id), false);
    assert.deepEqual((await autre.demander("GET", `/app/communaute/sorties/${s.id}`)).statut, 404);
    assert.deepEqual((await autre.demander("POST", `/app/communaute/sorties/${s.id}/demande`)).corps.erreur, "sortie-inconnue");
  }
  await ines.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  const vue = await nina.demander("GET", `/app/communaute/sorties/${s.id}`);
  const texte = JSON.stringify(vue.corps.sortie.participants) + JSON.stringify(vue.corps.sortie.demandes) + JSON.stringify(vue.corps.sortie.organisateur);
  assert.equal(/femme|homme|genre/.test(texte), false);
  b.banc.horloge.maintenant += 32 * JOUR;
  await choisirGenre(ines, "homme");
  assert.equal((await nina.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${ines.idPublic}`)).corps.erreur, "sortie-passee");
  b.banc.horloge.maintenant = Date.parse("2026-10-14T10:00:00Z");
  const autre = (await b.organiser(nina, b.nouvelleSortie(b.lieu(), { public: { type: "genre", genre: "femme" } }))).corps.sortie;
  await ines.demander("POST", `/app/communaute/sorties/${autre.id}/demande`);
  await b.banc.creerPersonne();
  b.communaute.profils.get(ines.compteId)!.genreChiffre = b.communaute.profils.get(sam.compteId)!.genreChiffre;
  assert.equal((await nina.demander("POST", `/app/communaute/sorties/${autre.id}/demandes/${ines.idPublic}`)).corps.erreur, "demande-inconnue");
});

test("tranche d'âge, nouveaux dans l'app et ambassadeurs : seuls leurs publics voient la sortie", async () => {
  const [orga, jeune, vieux, sansDate] = [await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  naissance(orga, "2002-03-01");
  naissance(jeune, "2005-05-20");
  naissance(vieux, "1980-01-01");
  const age = (await b.organiser(orga, b.nouvelleSortie(b.lieu(), { public: { type: "age", tranche: "18-25" } }))).corps.sortie;
  assert.ok((await idsDesSorties(jeune)).includes(age.id));
  assert.equal((await idsDesSorties(vieux)).includes(age.id), false);
  assert.equal((await idsDesSorties(sansDate)).includes(age.id), false);
  assert.equal((await b.organiser(vieux, b.nouvelleSortie(b.lieu(), { public: { type: "age", tranche: "18-25" } }))).corps.erreur, "public-reserve");

  b.vieillir(vieux);
  const nouveaux = (await b.organiser(vieux, b.nouvelleSortie(b.lieu(), { public: { type: "nouveaux" } }))).corps.sortie;
  assert.ok(nouveaux, "on peut accueillir les nouveaux sans en être");
  assert.ok((await idsDesSorties(jeune)).includes(nouveaux.id));
  const ancien = await b.banc.creerPersonne();
  b.vieillir(ancien);
  assert.equal((await idsDesSorties(ancien)).includes(nouveaux.id), false);

  const ambassadrice = await b.banc.creerPersonne();
  const compte = b.banc.memoire.comptes.get(ambassadrice.compteId);
  if (compte) compte.statutAmbassadeur = "actif";
  const reservee = (await b.organiser(ambassadrice, b.nouvelleSortie(b.lieu(), { public: { type: "ambassadeurs" } }))).corps.sortie;
  assert.equal((await idsDesSorties(jeune)).includes(reservee.id), false);
  assert.equal((await b.organiser(jeune, b.nouvelleSortie(b.lieu(), { public: { type: "ambassadeurs" } }))).corps.erreur, "public-reserve");
});

test("blocages : une personne bloquée ne voit pas la sortie de l'autre et ne peut pas la rejoindre", async () => {
  const [orga, bloque, participant, gene, tardif] = [await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  const s = (await b.organiser(orga, b.nouvelleSortie(b.lieu()))).corps.sortie;
  b.banc.bloquer(bloque, orga);
  assert.equal((await idsDesSorties(bloque)).includes(s.id), false);
  assert.equal((await bloque.demander("GET", `/app/communaute/sorties/${s.id}`)).statut, 404);
  assert.equal((await bloque.demander("POST", `/app/communaute/sorties/${s.id}/demande`)).corps.erreur, "sortie-inconnue");

  await participant.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${participant.idPublic}`);
  b.banc.bloquer(participant, gene);
  assert.equal((await gene.demander("GET", `/app/communaute/sorties/${s.id}`)).statut, 404, "un participant bloqué : la sortie n'existe pas pour lui");

  await tardif.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  b.banc.bloquer(tardif, participant);
  assert.deepEqual((await orga.demander("GET", `/app/communaute/sorties/${s.id}`)).corps.sortie.demandes.map((d: { personne: { id: string } }) => d.personne.id), [tardif.idPublic]);
  assert.equal((await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${tardif.idPublic}`)).corps.erreur, "demande-inconnue");

  b.banc.bloquer(orga, participant);
  const vue = (await orga.demander("GET", `/app/communaute/sorties/${s.id}`)).corps.sortie;
  assert.deepEqual(vue.participants.map((p: { personne: { id: string } }) => p.personne.id), [orga.idPublic]);
  assert.equal((await participant.demander("GET", `/app/communaute/sorties/${s.id}`)).statut, 404);
  await orga.demander("DELETE", `/app/communaute/sorties/${s.id}/demande`);
  assert.equal(b.communaute.participations.find((p) => p.sortieId === Number(s.id) && p.compteId === participant.compteId)?.statut, "refuse");
  assert.equal(b.membres(s.conversationId).includes(participant.compteId), false);
});

test("rappel la veille à 18 h et habitués : la semaine suivante, ils sont invités en premier", async () => {
  const [orga, sam, nina] = [await b.banc.creerPersonne({ prenom: "Orga" }), await b.banc.creerPersonne(), await b.banc.creerPersonne()];
  const quand = "2026-10-17T09:00:00.000Z";
  const s = (await b.organiser(orga, b.nouvelleSortie(b.lieu(), { quand, recurrente: true }))).corps.sortie;
  await sam.demander("POST", `/app/communaute/sorties/${s.id}/demande`);
  await orga.demander("POST", `/app/communaute/sorties/${s.id}/demandes/${sam.idPublic}`);
  const taches = b.banc.social.dependances.communaute!.sorties;
  b.banc.horloge.maintenant = Date.parse("2026-10-16T15:59:00Z");
  assert.equal((await taches.passerTaches(new Date(b.banc.horloge.maintenant))).rappels, 0);
  b.banc.horloge.maintenant = Date.parse("2026-10-16T16:00:00Z");
  const rappel = await taches.passerTaches(new Date(b.banc.horloge.maintenant));
  assert.ok(rappel.rappels >= 1);
  const destinataires = rappel.effets.flatMap((e) => (e.quoi === "cloche" && e.notification.cible?.id === s.id ? [e.notification.compteId] : []));
  assert.deepEqual(destinataires.sort((x, y) => x - y), [orga.compteId, sam.compteId].sort((x, y) => x - y));
  assert.ok(rappel.effets.some((e) => e.quoi === "push" && e.compteId === sam.compteId && e.message.titre.startsWith("⏰")));
  assert.equal((await taches.passerTaches(new Date(b.banc.horloge.maintenant))).rappels, 0, "un seul rappel");

  b.banc.horloge.maintenant = Date.parse(quand) + 5 * HEURE;
  const suite = await taches.passerTaches(new Date(b.banc.horloge.maintenant));
  assert.equal(suite.suites, 1);
  const prochaine = [...b.communaute.sorties.values()].find((x) => x.serieId === Number(s.id))!;
  assert.equal(prochaine.quand.toISOString(), "2026-10-24T09:00:00.000Z");
  const vueSam = (await sam.demander("GET", `/app/communaute/sorties/${prochaine.id}`)).corps.sortie;
  assert.equal(vueSam.moi.place, "aucune");
  assert.ok(vueSam.invitationHabitue);
  assert.equal((await nina.demander("GET", `/app/communaute/sorties/${prochaine.id}`)).corps.sortie.invitationHabitue, null);
  const entre = await sam.demander("POST", `/app/communaute/sorties/${prochaine.id}/demande`);
  assert.equal(entre.corps.sortie.moi.place, "accepte");
  assert.equal(entre.corps.sortie.habitues, 1);
  b.banc.horloge.maintenant = Date.parse("2026-10-14T10:00:00Z");
});
