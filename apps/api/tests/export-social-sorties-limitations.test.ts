// Tests de l'export « Télécharger mes données sociales » (GET /app/social/export, lot L7), suite de export-social.test.ts :
// une sortie quittée n'y est plus (« organisateur » : qui a la main) ; les limitations de ton compte (jamais celles des
// autres ni qui a décidé), lues sur le double des limitations du banc (banc.limitations), par le service puis par la route ;
// sans listerLimitations, pas de champ. Tout en mémoire, avec une clé de test.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerExportSocialEnMemoire } from "../src/services/export-social-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
  banc.tables.lieux.set(12, { statut: "publie", nom: "Chez Léa" });
});
after(() => banc.fermer());

const date = (decalageMs = 0) => new Date(banc.horloge.maintenant + decalageMs);
const exporter = async (p: PersonneDeTest) => {
  const r = await p.demander("GET", "/app/social/export");
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  return r;
};
const JOUR = 86_400_000;

test("une sortie que tu as quittée n'y est plus, même créée par toi ; qui prend la main y est « organisateur »", async () => {
  const lea = await banc.creerPersonne();
  const malo = await banc.creerPersonne();
  const noe = await banc.creerPersonne();
  banc.rendrePotes(lea, malo);
  banc.rendrePotes(lea, noe);
  const creee = await lea.demander("POST", "/app/sorties", {
    titre: "Pizza quittée", emoji: "🍕", quand: date(JOUR).toISOString(), finVote: date(JOUR / 2).toISOString(), invites: [malo.idPublic, noe.idPublic], lieux: [12],
    idClient: randomUUID(),
  });
  assert.equal(creee.statut, 201, JSON.stringify(creee.corps));
  const id = creee.corps.sortie.id as string;
  assert.equal((await malo.demander("POST", `/app/sorties/${id}/reponse`, { vient: true })).statut, 200);
  // Par le service (la route n'en permet que 2 par 24 h) : le même que GET /app/social/export
  const sorties = async (p: PersonneDeTest) => (await banc.social.dependances.exportSocial.exporter(p.compteId, date())).sorties.map((s) => [s.titre, s.role]);
  assert.deepEqual(await sorties(lea), [["Pizza quittée", "organisateur"]]);
  assert.deepEqual(await sorties(malo), [["Pizza quittée", "participant"]]);

  // Léa quitte : son invitation et sa place partent ; Malo, seul participant, a la main
  assert.equal((await lea.demander("DELETE", `/app/sorties/${id}/participation`)).statut, 200);
  const sortie = banc.tables.sorties.get(Number(id))!;
  const verifier = async (cas: string) => {
    assert.deepEqual(await sorties(lea), [], `${cas} : quittée, ni « organisateur », ni rien`);
    assert.equal((await malo.demander("GET", `/app/sorties/${id}`)).corps.sortie.moi.organisateur, true, cas);
    assert.deepEqual(await sorties(malo), [["Pizza quittée", "organisateur"]], `${cas} : comme l'app, celui qui a la main`);
    assert.deepEqual(await sorties(noe), [["Pizza quittée", "invite"]], `${cas} : son invitation attend toujours`);
  };
  assert.equal(sortie.organisateurId, malo.compteId, "quitter réaligne la colonne (marquerSortie)");
  await verifier("colonne réalignée");
  // Une colonne qui garde l'id de Léa (ligne d'avant l'alignement, ou un geste qui n'appelle pas marquer) : l'export suit
  // ton invitation et celui qui a la main, pas la colonne
  sortie.organisateurId = lea.compteId;
  await verifier("colonne pas réalignée");
});

test("les limitations de ton compte : motif, motivation, dates et ta contestation ; jamais celles des autres ni qui a décidé", async () => {
  const moi = await banc.creerPersonne();
  const autre = await banc.creerPersonne();
  const { limitations } = banc;
  // Par le service (la route n'en permet que 2 par 24 h) : le même que GET /app/social/export, branché sur banc.limitations
  const exporterParService = (p: PersonneDeTest) => banc.social.dependances.exportSocial.exporter(p.compteId, date());
  assert.deepEqual((await exporterParService(moi)).limitations, [], "branché, sans limitation : une liste vide");

  // Une ancienne, levée avant sa fin ; puis une en cours (jusqu'à nouvel ordre), contestée puis réexaminée
  const ancienne = await limitations.limiterCompte({
    compteId: moi.compteId, motif: "pub-cachee", motivation: "Des liens de pub dans tes commentaires", debut: date(-10 * JOUR), fin: date(-2 * JOUR),
  }, date(-11 * JOUR));
  assert.ok(ancienne.ok);
  assert.ok((await limitations.leverLimitation(ancienne.limitation.id, date(-5 * JOUR))).ok);
  const enCours = await limitations.limiterCompte({ compteId: moi.compteId, motif: "haine", motivation: "Des insultes répétées dans une discussion" }, date(-JOUR));
  assert.ok(enCours.ok);
  assert.ok((await limitations.contesterLimitation(moi.compteId, "Je n'ai insulté personne, relisez bien", date(-JOUR / 2))).ok);
  assert.ok((await limitations.reexaminerLimitation(enCours.limitation.id, date(-JOUR / 4))).ok);
  assert.ok((await limitations.limiterCompte({ compteId: autre.compteId, motif: "arnaque", motivation: "Motivation pour un autre compte" }, date())).ok);

  const e = await exporterParService(moi);
  assert.deepEqual(e.limitations, [
    {
      motif: "pub-cachee", motivation: "Des liens de pub dans tes commentaires", debut: date(-10 * JOUR).toISOString(), fin: date(-2 * JOUR).toISOString(),
      leveeLe: date(-5 * JOUR).toISOString(), contestation: null, contesteLe: null, reexamineLe: null, decideeLe: date(-11 * JOUR).toISOString(),
    },
    {
      motif: "haine", motivation: "Des insultes répétées dans une discussion", debut: date(-JOUR).toISOString(), fin: null, leveeLe: null,
      contestation: "Je n'ai insulté personne, relisez bien", contesteLe: date(-JOUR / 2).toISOString(), reexamineLe: date(-JOUR / 4).toISOString(),
      decideeLe: date(-JOUR).toISOString(),
    },
  ], "de la plus ancienne à la plus récente ; ni id, ni compte, ni personne de l'équipe");
  assert.ok(!JSON.stringify(e).includes("Motivation pour un autre compte"));
  // Sans listerLimitations (une API qui ne lit pas encore les limitations) : pas de champ, rien d'inventé
  const { relations, chiffrement } = banc.social.dependances;
  assert.equal("limitations" in (await creerExportSocialEnMemoire(banc.tables, relations, chiffrement).exporter(moi.compteId, date())), false);
});

test("par la route : ta limitation dans TON export (ni id, ni compte, ni personne de l'équipe) ; jamais dans celui d'un autre", async () => {
  const moi = await banc.creerPersonne();
  const autre = await banc.creerPersonne();
  assert.deepEqual((await exporter(moi)).corps.export.limitations, [], "branché, sans limitation : une liste vide");

  // Comme le logiciel de gestion : limité depuis hier, pour une semaine
  const limitee = await banc.limitations.limiterCompte({
    compteId: moi.compteId, motif: "arnaque", motivation: "Des faux bons de réduction envoyés à toute ta bande", fin: date(6 * JOUR),
  }, date(-JOUR));
  assert.ok(limitee.ok);
  const e = (await exporter(moi)).corps.export;
  assert.deepEqual(e.limitations, [{
    motif: "arnaque", motivation: "Des faux bons de réduction envoyés à toute ta bande", debut: date(-JOUR).toISOString(), fin: date(6 * JOUR).toISOString(),
    leveeLe: null, contestation: null, contesteLe: null, reexamineLe: null, decideeLe: date(-JOUR).toISOString(),
  }], "ce qu'on t'en a dit, rien de plus");
  const texte = JSON.stringify(e.limitations);
  for (const interdit of ['"id"', '"compteId"', '"creeLe"']) assert.ok(!texte.includes(interdit), `jamais ${interdit} dans tes limitations`);

  const pourAutre = (await exporter(autre)).corps.export;
  assert.deepEqual(pourAutre.limitations, [], "la limitation d'un autre compte n'est jamais dans ton export");
  assert.ok(!JSON.stringify(pourAutre).includes("faux bons de réduction"));
});
