// Tests des décisions de l'équipe sur les avis et les réponses des lieux (services/avis-gestion.ts), appelées par le logiciel
// de gestion : statut changé une seule fois, défis relancés après, rappel dans la transaction, rétablissement dans la
// transaction de l'appelant (retablirAvisDans, puis apresRetablir ; une transaction inconnue rend une promesse rejetée). Les
// points de la photo (retrait plafonné, rendu, pannes) : avis-gestion-points.test.ts. Aucune base de données : le banc de
// tests/outils/creer-banc-avis-gestion.ts. La vraie base : essai PGlite hors ligne (creerDepotAvis() avec le vrai client
// Prisma et toutes les migrations).
import assert from "node:assert/strict";
import { test } from "node:test";

import { resumerAvis } from "../../../packages/commun/src/fonctions/avis/resumer-avis.ts";
import { AUTEUR, creerBancAvisGestion as creerBanc, GERANT, MAINTENANT, POINTS_DEPART, REPONSE } from "./outils/creer-banc-avis-gestion.ts";

test("publier : en relecture → publié, sans points, défis relancés pour un avis vérifié seulement ; une seule fois", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  assert.deepEqual(await b.gestion.trancherAvis(id, { action: "publier" }, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, statut: "publie", pointsRetires: 0 });
  assert.equal(b.ligne(id).statut, "publie");
  assert.deepEqual(b.points, []);
  assert.deepEqual(b.defis, [{ compteId: AUTEUR, maintenant: MAINTENANT }]);
  assert.deepEqual((await b.pagePublique()).ids, [id]);

  // Une deuxième décision, la même ou l'autre : déjà tranché, rien ne bouge
  for (const action of ["publier", "masquer"] as const) {
    assert.deepEqual(await b.gestion.trancherAvis(id, { action }, MAINTENANT), { ok: false, erreur: "deja-tranche", statut: "publie" });
  }
  assert.deepEqual([b.ligne(id).statut, b.points.length, b.defis.length], ["publie", 0, 1]);

  // Un avis non vérifié publié ne compte pas pour les défis
  const nonVerifie = await b.avis({ verifie: false });
  assert.equal((await b.gestion.trancherAvis(nonVerifie, { action: "publier" }, MAINTENANT)).ok, true);
  assert.equal(b.defis.length, 1);
  assert.deepEqual(await b.gestion.trancherAvis(999, { action: "publier" }, MAINTENANT), { ok: false, erreur: "introuvable" });
});

test("masquer : l'avis sort de la page publique, de la moyenne et du comptoir ; −10 points pour sa photo, sans défis", async () => {
  const b = creerBanc();
  const garde = await b.avis({ note: 5, statut: "publie", raisonRelecture: null });
  const id = await b.avis({ note: 1, photo: "photo-7.jpg" });
  const avant = await b.pagePublique();
  assert.deepEqual([avant.ids, avant.resume.nombre], [[id, garde], 2], "en relecture, il reste visible");

  assert.deepEqual(await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, statut: "masque", pointsRetires: 10 });
  assert.equal(b.ligne(id).statut, "masque");
  const apres = await b.pagePublique();
  assert.deepEqual(apres.ids, [garde]);
  assert.deepEqual(apres.resume, resumerAvis([5], []));
  assert.deepEqual((await b.comptoir()).map((a) => a.id), [garde]);
  assert.deepEqual(b.points, [{ compteId: AUTEUR, points: -10, raison: "avis-photo", detail: `avis masqué ${id}, lieu 1` }]);
  assert.equal(b.total(), POINTS_DEPART + 10 - 10, "+10 avec l'avis (avis-client.ts), −10 au masquage");
  assert.deepEqual(b.defis, []);
  assert.deepEqual(await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT), { ok: false, erreur: "deja-tranche", statut: "masque" });
  assert.equal(b.points.length, 1, "jamais retirés deux fois");
  // Masqué, il n'accepte plus de réponse du lieu
  assert.deepEqual(await b.pro.repondre(GERANT, id, REPONSE), { ok: false, erreur: "introuvable" });
});

test("défis : une réévaluation qui rate après coup est notée au journal ; statut et points restent écrits", async (t) => {
  const journal = t.mock.method(console, "error", () => {});
  const b = creerBanc();
  b.panne.defis = true;
  const publie = await b.avis({ photo: "photo-7.jpg" });
  assert.equal((await b.gestion.trancherAvis(publie, { action: "publier" }, MAINTENANT)).ok, true);
  const masque = await b.avis({ photo: "photo-7.jpg" });
  await b.gestion.trancherAvis(masque, { action: "masquer" }, MAINTENANT);
  assert.deepEqual(await b.gestion.retablirAvis(masque, MAINTENANT), { ok: true, avisId: masque, compteId: AUTEUR, lieuId: 1, pointsRendus: 10, aReevaluer: true });
  assert.deepEqual([b.ligne(publie).statut, b.ligne(masque).statut, b.points.map((p) => p.points)], ["publie", "publie", [-10, 10]]);
  assert.equal(journal.mock.callCount(), 2, "la publication et le retour en ligne");
});

test("deux décisions en même temps sur le même avis : une seule passe, et un seul rappel", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  let rappels = 0;
  const o = { dansLaTransaction: async () => void rappels++ };
  const [premiere, seconde] = await Promise.all([
    b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT, o),
    b.gestion.trancherAvis(id, { action: "publier" }, MAINTENANT, o),
  ]);
  const gagnantes = [premiere, seconde].filter((r) => r.ok);
  assert.equal(gagnantes.length, 1);
  const gagnante = gagnantes[0]!;
  assert.ok(gagnante.ok);
  assert.deepEqual([premiere, seconde].find((r) => !r.ok), { ok: false, erreur: "deja-tranche", statut: gagnante.statut });
  assert.equal(b.ligne(id).statut, gagnante.statut);
  assert.equal(rappels, 1);
  assert.equal(b.points.length, gagnante.statut === "masque" ? 1 : 0);

  // Même chose pour la réponse du lieu
  const autre = await b.avis({ statut: "publie" });
  await b.repondre(autre);
  const reponses = await Promise.all([
    b.gestion.trancherReponseAvis(autre, { action: "publier" }, MAINTENANT),
    b.gestion.trancherReponseAvis(autre, { action: "masquer" }, MAINTENANT),
  ]);
  assert.equal(reponses.filter((r) => r.ok).length, 1);
  assert.equal(reponses.filter((r) => !r.ok && r.erreur === "deja-tranche").length, 1);
});

test("dansLaTransaction : appelé une fois après le changement de statut ; une erreur dedans annule tout", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  const appels: { tx: unknown; r: unknown; statutLu: string; pointsLus: number[] }[] = [];
  await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT, {
    dansLaTransaction: async (tx, r) => void appels.push({ tx, r, statutLu: b.ligne(id).statut, pointsLus: b.points.map((p) => p.points) }),
  });
  assert.deepEqual(appels, [{ tx: null, r: { avisId: id, compteId: AUTEUR, lieuId: 1 }, statutLu: "masque", pointsLus: [-10] }], "statut et points déjà posés");

  // Le rappel lève : le statut et les points reviennent, pas de défis, l'erreur remonte ; une nouvelle décision passe ensuite
  const autre = await b.avis({ photo: "photo-7.jpg" });
  const avant = b.points.length;
  const echec = async () => { throw new Error("signalement impossible"); };
  for (const action of ["masquer", "publier"] as const) {
    await assert.rejects(b.gestion.trancherAvis(autre, { action }, MAINTENANT, { dansLaTransaction: echec }), /signalement impossible/);
    assert.equal(b.ligne(autre).statut, "en-relecture");
  }
  assert.deepEqual([b.points.length, b.defis.length], [avant, 0]);
  assert.equal((await b.gestion.trancherAvis(autre, { action: "publier" }, MAINTENANT)).ok, true);

  // Pareil pour une réponse
  await b.repondre(autre);
  await assert.rejects(b.gestion.trancherReponseAvis(autre, { action: "masquer" }, MAINTENANT, { dansLaTransaction: echec }), /signalement impossible/);
  assert.equal(b.ligne(autre).reponseStatut, "en-relecture");
});

test("réponse du lieu : posée en relecture et visible, puis publiée ou masquée (cachée au public et au comptoir)", async () => {
  const b = creerBanc();
  const id = await b.avis({ statut: "publie" });
  const sansReponse = await b.avis({ statut: "publie" });
  await b.repondre(id);
  assert.deepEqual([b.ligne(id).reponseStatut, b.ligne(id).reponseParId], ["en-relecture", GERANT]);
  const reponseDe = async (avisId: number) => ({
    publique: (await b.pagePublique()).avis.find((a) => a.id === avisId)!.reponseLieu?.texte ?? null,
    comptoir: (await b.comptoir()).find((a) => a.id === avisId)!.reponseLieu?.texte ?? null,
  });
  assert.deepEqual(await reponseDe(id), { publique: REPONSE, comptoir: REPONSE }, "visible pendant la relecture");

  const rappels: unknown[] = [];
  assert.deepEqual(
    await b.gestion.trancherReponseAvis(id, { action: "publier" }, MAINTENANT, { dansLaTransaction: async (_tx, r) => void rappels.push(r) }),
    { ok: true, avisId: id, compteId: GERANT, lieuId: 1, statut: "publiee" },
  );
  assert.deepEqual(rappels, [{ avisId: id, compteId: GERANT, lieuId: 1 }], "la décision va au compte qui a écrit la réponse");
  assert.equal(b.ligne(id).reponseStatut, "publiee");
  assert.deepEqual(await reponseDe(id), { publique: REPONSE, comptoir: REPONSE });
  assert.deepEqual(await b.gestion.trancherReponseAvis(id, { action: "masquer" }, MAINTENANT), { ok: false, erreur: "deja-tranche", statut: "publiee" });

  const masquee = await b.avis({ statut: "publie" });
  await b.repondre(masquee);
  assert.deepEqual(await b.gestion.trancherReponseAvis(masquee, { action: "masquer" }, MAINTENANT), { ok: true, avisId: masquee, compteId: GERANT, lieuId: 1, statut: "masquee" });
  assert.deepEqual(await reponseDe(masquee), { publique: null, comptoir: null });
  assert.equal(b.ligne(masquee).statut, "publie", "l'avis lui-même ne bouge pas");
  assert.deepEqual([b.points, b.defis], [[], []], "jamais de points ni de défis pour une réponse");

  for (const avisId of [sansReponse, 999]) {
    assert.deepEqual(await b.gestion.trancherReponseAvis(avisId, { action: "publier" }, MAINTENANT), { ok: false, erreur: "introuvable" });
  }
});

test("rétablir : un avis masqué revient en ligne, avec les points de sa photo et les défis ; sinon pas-masque", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: false, erreur: "pas-masque" }, "encore en relecture");
  await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT);
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, pointsRendus: 10, aReevaluer: true });
  assert.equal(b.ligne(id).statut, "publie");
  assert.deepEqual((await b.pagePublique()).ids, [id]);
  assert.deepEqual(b.points.map((p) => [p.compteId, p.points, p.raison, p.detail]), [
    [AUTEUR, -10, "avis-photo", `avis masqué ${id}, lieu 1`], [AUTEUR, 10, "avis-photo", `avis rétabli ${id}, lieu 1`],
  ]);
  assert.deepEqual(b.defis, [{ compteId: AUTEUR, maintenant: MAINTENANT }]);
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: false, erreur: "pas-masque" }, "déjà en ligne");
  assert.deepEqual(await b.gestion.retablirAvis(999, MAINTENANT), { ok: false, erreur: "introuvable" });

  // Sans photo ni visite : en ligne, sans points ni défis
  const nonVerifie = await b.avis({ verifie: false, photo: "photo-7.jpg" });
  await b.gestion.trancherAvis(nonVerifie, { action: "masquer" }, MAINTENANT);
  assert.deepEqual(await b.gestion.retablirAvis(nonVerifie, MAINTENANT), { ok: true, avisId: nonVerifie, compteId: AUTEUR, lieuId: 1, pointsRendus: 0, aReevaluer: false });
  assert.deepEqual([b.points.length, b.defis.length], [2, 1]);
});

test("rétablir une réponse : masquée → publiée, sans points ; sinon pas-masque ou introuvable", async () => {
  const b = creerBanc();
  const id = await b.avis({ statut: "publie" });
  await b.repondre(id);
  assert.deepEqual(await b.gestion.retablirReponseAvis(id, MAINTENANT), { ok: false, erreur: "pas-masque" });
  await b.gestion.trancherReponseAvis(id, { action: "masquer" }, MAINTENANT);
  assert.deepEqual(await b.gestion.retablirReponseAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: GERANT, lieuId: 1, pointsRendus: 0, aReevaluer: false });
  assert.equal(b.ligne(id).reponseStatut, "publiee");
  assert.equal((await b.pagePublique()).avis[0]!.reponseLieu?.texte, REPONSE);
  assert.deepEqual(await b.gestion.retablirReponseAvis(id, MAINTENANT), { ok: false, erreur: "pas-masque" });
  assert.deepEqual(await b.gestion.retablirReponseAvis(await b.avis(), MAINTENANT), { ok: false, erreur: "introuvable" });
  assert.deepEqual([b.points, b.defis], [[], []]);
});

test("retablirAvisDans : dans la transaction de l'appelant ; si elle échoue après, rien n'est rétabli ; défis après", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT);
  const attendu = { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, pointsRendus: 10, aReevaluer: true };
  /** Le total avec les points de la photo, posés à l'écriture */
  const ecrit = POINTS_DEPART + 10;

  // La transaction de l'appelant lève après le rétablissement : statut, total et journal reviennent, pas de défis
  let vuDedans: unknown = null;
  await assert.rejects(b.memoire.transaction(async (tx) => {
    vuDedans = [await b.gestion.retablirAvisDans(tx, id, MAINTENANT), b.ligne(id).statut, b.total()];
    throw new Error("décision impossible");
  }), /décision impossible/);
  assert.deepEqual(vuDedans, [attendu, "publie", ecrit], "dans la transaction : rétabli avec ses points");
  assert.deepEqual([b.ligne(id).statut, b.total(), b.points.map((p) => p.points), b.defis], ["masque", ecrit - 10, [-10], []]);

  // Une erreur de la base pendant le rendu des points lève : la transaction de l'appelant revient en arrière
  b.panne.points = true;
  await assert.rejects(b.memoire.transaction((tx) => b.gestion.retablirAvisDans(tx, id, MAINTENANT)), /base indisponible/);
  assert.deepEqual([b.ligne(id).statut, b.total()], ["masque", ecrit - 10]);
  b.panne.points = false;

  // Validée : rétabli avec ses points ; les défis attendent apresRetablir
  const r = await b.memoire.transaction((tx) => b.gestion.retablirAvisDans(tx, id, MAINTENANT));
  assert.deepEqual(r, attendu);
  assert.deepEqual([b.ligne(id).statut, b.total(), b.defis], ["publie", ecrit, []]);
  await b.gestion.apresRetablir(r, MAINTENANT);
  assert.deepEqual(b.defis, [{ compteId: AUTEUR, maintenant: MAINTENANT }]);
  await assert.rejects(Promise.resolve().then(() => b.memoire.depot.dans({} as never)), /transaction inconnue/, "hors d'une transaction ouverte");
});

test("retablirAvisDans : « pas-masque » et « introuvable » rendus sans lever ; la transaction de l'appelant continue", async (t) => {
  const b = creerBanc();
  const enRelecture = await b.avis({ photo: "photo-7.jpg" });
  const masque = await b.avis({ photo: "photo-7.jpg" });
  await b.gestion.trancherAvis(masque, { action: "masquer" }, MAINTENANT);
  const rendus = await b.memoire.transaction(async (tx) => [
    await b.gestion.retablirAvisDans(tx, enRelecture, MAINTENANT),
    await b.gestion.retablirAvisDans(tx, 999, MAINTENANT),
    await b.gestion.retablirReponseAvisDans(tx, enRelecture, MAINTENANT),
    await b.gestion.retablirAvisDans(tx, masque, MAINTENANT),
  ]);
  assert.deepEqual(rendus, [
    { ok: false, erreur: "pas-masque" }, { ok: false, erreur: "introuvable" }, { ok: false, erreur: "introuvable" },
    { ok: true, avisId: masque, compteId: AUTEUR, lieuId: 1, pointsRendus: 10, aReevaluer: true },
  ]);
  assert.deepEqual([b.ligne(enRelecture).statut, b.ligne(masque).statut, b.total()], ["en-relecture", "publie", POINTS_DEPART + 2 * 10], "les +10 de leurs deux photos");
  for (const r of rendus.slice(0, 3)) await b.gestion.apresRetablir(r, MAINTENANT);
  assert.deepEqual(b.defis, [], "rien à relancer pour un échec");

  // apresRetablir ne lève jamais : une réévaluation qui rate est notée au journal
  const journal = t.mock.method(console, "error", () => {});
  b.panne.defis = true;
  await b.gestion.apresRetablir(rendus[3]!, MAINTENANT);
  assert.equal(journal.mock.callCount(), 1);

  // La réponse d'un lieu : défaite avec la transaction de l'appelant, sinon rétablie (sans points ni défis)
  const repondu = await b.avis({ statut: "publie" });
  await b.repondre(repondu);
  await b.gestion.trancherReponseAvis(repondu, { action: "masquer" }, MAINTENANT);
  await assert.rejects(b.memoire.transaction(async (tx) => {
    assert.equal((await b.gestion.retablirReponseAvisDans(tx, repondu, MAINTENANT)).ok, true);
    throw new Error("après");
  }), /après/);
  assert.equal(b.ligne(repondu).reponseStatut, "masquee");
  assert.deepEqual(await b.memoire.transaction((tx) => b.gestion.retablirReponseAvisDans(tx, repondu, MAINTENANT)),
    { ok: true, avisId: repondu, compteId: GERANT, lieuId: 1, pointsRendus: 0, aReevaluer: false });
  assert.equal(b.ligne(repondu).reponseStatut, "publiee");
});

test("retablirAvisDans, retablirReponseAvisDans : une transaction inconnue rend une promesse rejetée, jamais une exception directe", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT);
  for (const retablir of [b.gestion.retablirAvisDans, b.gestion.retablirReponseAvisDans]) {
    let appel: Promise<unknown> | undefined;
    // Le jeton n'a jamais été ouvert par transaction : depot.dans lève, et cette erreur doit passer par la promesse
    assert.doesNotThrow(() => { appel = retablir({} as never, id, MAINTENANT); }, retablir.name);
    assert.ok(appel instanceof Promise, retablir.name);
    await assert.rejects(appel, /transaction inconnue/, retablir.name);
  }
  assert.deepEqual([b.ligne(id).statut, b.points.map((p) => p.points)], ["masque", [-10]], "rien n'a bougé");
});
