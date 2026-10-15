import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { calculerBorneClocheLue } from "../src/fonctions/social/calculer-borne-cloche-lue.ts";
import { LIMITE_GESTES_SOCIAUX } from "../src/routes/social-app.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const limites = new Set<number>();
let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial({ estLimite: async (compteId) => (limites.has(compteId) ? { jusqua: null, motif: "spam" } : null) });
});
after(() => banc.fermer());

const HEURE = 60 * 60 * 1000;
const date = (decalageMs = 0) => new Date(banc.horloge.maintenant + decalageMs);
const iso = (decalageMs = 0) => date(decalageMs).toISOString();
const noter = (...n: Parameters<typeof banc.social.dependances.cloche.noter>[0]) => banc.social.dependances.cloche.noter(n, date());
const lignesDe = (p: PersonneDeTest) => [...banc.tables.cloche.values()].filter((l) => l.compteId === p.compteId);
const poulsCloche = async (p: PersonneDeTest) => (await p.demander("GET", "/app/social/pouls")).corps.pouls.cloche;
const effacerLues = (p: PersonneDeTest, corps: Record<string, unknown> = {}) => p.demander("POST", "/app/cloche/effacer-lues", corps);

test("calculerBorneClocheLue : vuesLe du serveur avec un profil, jusqua sans profil, jamais après maintenant ni après jusqua", () => {
  const maintenant = new Date("2026-10-14T10:00:00Z");
  const il = (heures: number) => new Date(maintenant.getTime() - heures * HEURE);
  const borne = (o: { aProfil: boolean; vuesLe?: Date; jusqua?: Date }) =>
    calculerBorneClocheLue({ aProfil: o.aProfil, vuesLe: o.vuesLe ?? null, jusqua: o.jusqua ?? null, maintenant })?.toISOString() ?? null;
  assert.equal(borne({ aProfil: true, vuesLe: il(2) }), il(2).toISOString());
  assert.equal(borne({ aProfil: true, vuesLe: il(2), jusqua: il(3) }), il(3).toISOString(), "jusqua resserre");
  assert.equal(borne({ aProfil: true, vuesLe: il(2), jusqua: il(-48) }), il(2).toISOString(), "jamais après vuesLe");
  assert.equal(borne({ aProfil: true, jusqua: il(1) }), null, "un profil sans vuesLe : rien n'est lu, quoi que dise le téléphone");
  assert.equal(borne({ aProfil: false }), null, "sans profil ni date du téléphone : rien n'est lu");
  assert.equal(borne({ aProfil: false, jusqua: il(1) }), il(1).toISOString());
  assert.equal(borne({ aProfil: false, jusqua: il(-48) }), maintenant.toISOString(), "jamais après maintenant");
});

test("DELETE /app/cloche/:id : la tienne, lue ou pas ; celle d'un autre, d'un bloqué ou inconnue : 404 sans rien dire", async () => {
  const moi = await banc.creerPersonne({ pseudo: "efface.moi" });
  const autre = await banc.creerPersonne({ pseudo: "efface.autre" });
  const lea = await banc.creerPersonne({ pseudo: "efface.lea" });
  const bloque = await banc.creerPersonne({ pseudo: "efface.bloque" });
  await noter(
    { compteId: moi.compteId, type: "nouvel-abonne", acteurId: lea.compteId },
    { compteId: moi.compteId, type: "nouvel-abonne", acteurId: bloque.compteId },
    { compteId: autre.compteId, type: "nouvel-abonne", acteurId: lea.compteId },
  );
  banc.bloquer(moi, bloque);
  const mienne = lignesDe(moi).find((l) => l.acteurId === lea.compteId)!;
  const cachee = lignesDe(moi).find((l) => l.acteurId === bloque.compteId)!;
  const sienne = lignesDe(autre)[0]!;
  const avant = await poulsCloche(moi);
  assert.equal(avant.nonVues, 1);

  const effacee = await moi.demander("DELETE", `/app/cloche/${mienne.id}`);
  assert.deepEqual([effacee.statut, effacee.corps], [200, { ok: true }]);
  assert.equal(effacee.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual((await moi.demander("GET", "/app/cloche")).corps.cloche.notifications, []);
  const apres = await poulsCloche(moi);
  assert.equal(apres.nonVues, 0, "une non-vue effacée ne compte plus");
  assert.notEqual(apres.signature, avant.signature, "tes autres téléphones relisent la cloche");

  for (const id of [sienne.id, cachee.id, mienne.id, 999_999]) {
    const r = await moi.demander("DELETE", `/app/cloche/${id}`);
    assert.deepEqual([r.statut, r.corps], [404, { ok: false, erreur: "notification-inconnue" }], `notification ${id}`);
  }
  assert.equal(lignesDe(autre).length, 1, "celle d'un autre reste où elle est");
  assert.equal(lignesDe(moi).length, 1, "celle d'une personne bloquée aussi : tu ne la vois pas");
  for (const id of ["abc", "0", "-1", "1.5"]) {
    const r = await moi.demander("DELETE", `/app/cloche/${id}`);
    assert.deepEqual([r.statut, r.corps.champ], [400, "id"], id);
  }
});

test("effacer-lues avec un profil social : jusqu'à vuesLe du serveur, jamais plus récent ; jusqua resserre ; le pouls reste juste", async () => {
  const moi = await banc.creerPersonne({ pseudo: "lues.moi" });
  const autre = await banc.creerPersonne({ pseudo: "lues.autre" });
  const acteurs: PersonneDeTest[] = [];
  for (let i = 0; i < 3; i++) acteurs.push(await banc.creerPersonne({ pseudo: `lues.acteur.${i}` }));
  const debut = banc.horloge.maintenant;
  await noter({ compteId: moi.compteId, type: "signalement-decide", acteurId: null, cible: { type: "signalement", id: "31" }, detail: "retenu" });
  await noter({ compteId: autre.compteId, type: "nouvel-abonne", acteurId: acteurs[0]!.compteId });
  for (const acteur of acteurs) {
    banc.horloge.maintenant += HEURE;
    await noter({ compteId: moi.compteId, type: "nouvel-abonne", acteurId: acteur.compteId });
  }
  banc.horloge.maintenant += HEURE;
  const a = (heures: number) => new Date(debut + heures * HEURE).toISOString();

  const jamaisVue = await effacerLues(moi, { jusqua: iso(48 * HEURE) });
  assert.deepEqual([jamaisVue.statut, jamaisVue.corps], [200, { ok: true, effacees: 0 }], "rien n'est vu : rien n'est lu");
  assert.equal((await moi.demander("POST", "/app/cloche/vu", { jusqua: a(1) })).corps.vuesLe, a(1));
  const avant = await poulsCloche(moi);
  assert.equal(avant.nonVues, 2);

  assert.equal((await effacerLues(moi, { jusqua: a(0) })).corps.effacees, 1, "jusqua resserre : la seule d'avant");
  const r = await effacerLues(moi, { jusqua: iso(48 * HEURE) });
  assert.deepEqual([r.statut, r.corps], [200, { ok: true, effacees: 1 }], "celle vue à la milliseconde près, rien de plus récent que vuesLe");
  assert.equal(r.entetes.get("cache-control"), "private, no-store");
  assert.deepEqual(lignesDe(moi).map((l) => l.creeLe.toISOString()).sort(), [a(2), a(3)]);
  assert.equal((await moi.demander("GET", "/app/cloche")).corps.cloche.notifications.length, 2);
  assert.equal(lignesDe(autre).length, 1, "jamais la cloche d'un autre");
  const apres = await poulsCloche(moi);
  assert.equal(apres.nonVues, 2, "les non-vues restent comptées");
  assert.notEqual(apres.signature, avant.signature);
  assert.equal((await effacerLues(moi)).corps.effacees, 0, "plus rien de lu");

  await moi.demander("POST", "/app/cloche/vu");
  assert.equal((await effacerLues(moi)).corps.effacees, 2);
  assert.deepEqual(await poulsCloche(moi), { nonVues: 0, signature: "0:0:" });
  assert.equal((await effacerLues(moi, { jusqua: "hier soir" })).corps.champ, "jusqua");
  assert.equal((await effacerLues(moi, { jusqua: 12 })).corps.champ, "jusqua");
});

test("jusqua d'avant 1970 (année 0 ou négative) : 400 sur /vu et /effacer-lues, jamais une erreur de la base", async () => {
  const moi = await banc.creerPersonne({ pseudo: "lues.dates" });
  for (const jusqua of ["0000-01-01T00:00:00.000Z", "-000001-01-01T00:00:00.000Z", "-271821-04-20T00:00:00.000Z", "1969-12-31T23:59:59.999Z"]) {
    for (const chemin of ["/app/cloche/vu", "/app/cloche/effacer-lues"]) {
      const r = await moi.demander("POST", chemin, { jusqua });
      assert.deepEqual([r.statut, r.corps.erreur, r.corps.champ], [400, "champ-invalide", "jusqua"], `${chemin} ${jusqua}`);
    }
  }
  assert.equal((await effacerLues(moi, { jusqua: "1970-01-01T00:00:00.000Z" })).statut, 200);
});

test("limite de débit : DELETE et effacer-lues partagent celle des gestes, 429 avec Retry-After", async () => {
  const moi = await banc.creerPersonne({ pseudo: "lues.debit" });
  let premier429 = 0;
  let r = await moi.demander("DELETE", "/app/cloche/999999");
  for (let i = 1; i <= LIMITE_GESTES_SOCIAUX.maximum + 1 && r.statut !== 429; i++) {
    premier429 = i;
    r = await moi.demander("DELETE", `/app/cloche/${999_999 - i}`);
  }
  assert.equal(r.statut, 429);
  assert.ok(premier429 > 0 && premier429 < LIMITE_GESTES_SOCIAUX.maximum);
  assert.equal(r.corps.erreur, "trop-de-demandes");
  assert.ok(r.entetes.get("retry-after"));
  const lues = await effacerLues(moi);
  assert.deepEqual([lues.statut, lues.corps.erreur], [429, "trop-de-demandes"]);
});

test("effacer-lues sans profil social : la date du téléphone (jusqua), jamais après maintenant ; sans elle, rien ; aucun profil créé", async () => {
  const p = await banc.creerPersonne({ pseudo: "lues.sans.profil", sansProfil: true });
  const decision = (id: string) => noter({ compteId: p.compteId, type: "signalement-decide", acteurId: null, cible: { type: "signalement", id }, detail: "rejete" });
  const debut = banc.horloge.maintenant;
  await decision("41");
  banc.horloge.maintenant += HEURE;
  await decision("42");
  banc.horloge.maintenant += HEURE;
  await decision("43");
  const a = (heures: number) => new Date(debut + heures * HEURE).toISOString();

  assert.deepEqual((await effacerLues(p)).corps, { ok: true, effacees: 0 }, "le serveur ne sait pas ce que tu as vu");
  assert.equal((await effacerLues(p, { jusqua: a(0) })).corps.effacees, 1);
  banc.horloge.maintenant -= HEURE / 2;
  assert.equal((await effacerLues(p, { jusqua: iso(48 * HEURE) })).corps.effacees, 1, "jamais une notification plus récente que maintenant");
  banc.horloge.maintenant += HEURE / 2;
  assert.deepEqual(lignesDe(p).map((l) => l.creeLe.toISOString()), [a(2)]);
  assert.equal(banc.tables.profils.has(p.compteId), false, "effacer ne crée pas le profil social");
  assert.equal((await poulsCloche(p)).nonVues, 0);

  const supprimee = await p.demander("DELETE", `/app/cloche/${lignesDe(p)[0]!.id}`);
  assert.deepEqual([supprimee.statut, lignesDe(p).length], [200, 0], "une à une, même sans profil");
});

test("l'anti-doublon tient après effacement : une seule ligne neuve, puis remontée ; pas de second son pour une réinvitation", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa", pseudo: "doublon.lea" });
  const tom = await banc.creerPersonne({ pseudo: "doublon.tom" });
  banc.rendrePotes(lea, tom);
  banc.tables.lieux.set(900, { statut: "publie", nom: "Le Bouiboui du test" });
  const creee = await lea.demander("POST", "/app/sorties", {
    titre: "Pizza du jeudi", emoji: "🍕", quand: iso(3 * HEURE), finVote: iso(HEURE), invites: [tom.idPublic], lieux: [900], idClient: randomUUID(),
  });
  assert.equal(creee.statut, 201);
  const sortie = creee.corps.sortie;
  await banc.attendreEnvois();
  const sons = () => banc.pushs.filter((p) => p.compteId === tom.compteId).length;
  assert.deepEqual([lignesDe(tom).length, sons()], [1, 1]);

  const reinviter = async () => {
    banc.horloge.maintenant += 60_000;
    assert.equal((await lea.demander("DELETE", `/app/sorties/${sortie.id}/participants/${tom.idPublic}`)).statut, 200);
    assert.equal((await lea.demander("POST", `/app/sorties/${sortie.id}/invites`, { invites: [tom.idPublic] })).statut, 200);
    await banc.attendreEnvois();
  };
  await tom.demander("POST", "/app/cloche/vu");
  assert.equal((await effacerLues(tom)).corps.effacees, 1);
  await reinviter();
  assert.equal(lignesDe(tom).length, 1, "une seule ligne neuve");
  assert.equal(sons(), 1, "pas de second son dans les 24 h : il ne dépend pas de la cloche");
  assert.equal((await poulsCloche(tom)).nonVues, 1, "revenue « pas vue », comme l'aurait fait la ligne remontée");

  const neuve = lignesDe(tom)[0]!;
  assert.equal((await tom.demander("DELETE", `/app/cloche/${neuve.id}`)).statut, 200);
  await reinviter();
  const suivante = lignesDe(tom)[0]!;
  await reinviter();
  assert.deepEqual(lignesDe(tom).map((l) => l.id), [suivante.id], "puis remontée, jamais en double");
  assert.equal(lignesDe(tom)[0]!.creeLe.getTime(), banc.horloge.maintenant);
  assert.equal(sons(), 1);
});

test("compte limité : effacer sa cloche reste permis ; sans session : 401", async () => {
  const moi = await banc.creerPersonne({ pseudo: "limite.cloche" });
  const lea = await banc.creerPersonne({ pseudo: "limite.lea" });
  const zoe = await banc.creerPersonne({ pseudo: "limite.zoe" });
  await noter({ compteId: moi.compteId, type: "nouvel-abonne", acteurId: lea.compteId }, { compteId: moi.compteId, type: "nouvel-abonne", acteurId: zoe.compteId });
  limites.add(moi.compteId);
  try {
    assert.equal((await moi.demander("POST", "/app/listes", {})).corps.erreur, "compte-limite", "le compte est bien limité");
    assert.equal((await moi.demander("DELETE", `/app/cloche/${lignesDe(moi)[0]!.id}`)).statut, 200);
    await moi.demander("POST", "/app/cloche/vu");
    assert.deepEqual((await effacerLues(moi)).corps, { ok: true, effacees: 1 });
  } finally {
    limites.delete(moi.compteId);
  }
  for (const [methode, chemin] of [["DELETE", "/app/cloche/1"], ["POST", "/app/cloche/effacer-lues"]] as const) {
    const r = await banc.demander(methode, chemin, methode === "POST" ? { corps: {} } : {});
    assert.deepEqual([r.statut, r.corps.erreur], [401, "session-expiree"], `${methode} ${chemin}`);
  }
});
