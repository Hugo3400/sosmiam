// Tests des points de la photo d'un avis quand l'équipe le masque puis le remet en ligne (services/avis-gestion.ts) : posés
// à l'écriture (la ligne « avis <id>, lieu <lieuId> » de controleurs/avis.ts, rejouée par le banc), retirés DANS la
// transaction du statut sans jamais dépasser ni le total du compte (plancher à 0) ni ce que CET avis tient encore d'après le
// journal, rendus au retour en ligne comme le journal les dit retirés (jamais un point de plus), tout ou rien. Aucune base
// de données : le banc de tests/outils/creer-banc-avis-gestion.ts. La vraie base : essai PGlite hors ligne.
import assert from "node:assert/strict";
import { test } from "node:test";

import { AUTEUR, creerBancAvisGestion as creerBanc, MAINTENANT, POINTS_DEPART } from "./outils/creer-banc-avis-gestion.ts";

test("masquer : points retirés seulement pour un avis vérifié, avec photo, d'un repas pas offert", async () => {
  const b = creerBanc();
  const sansPhoto = await b.avis();
  const offert = await b.avis({ photo: "photo-7.jpg", repasOffert: true });
  const nonVerifie = await b.avis({ verifie: false, photo: "photo-7.jpg" });
  for (const id of [sansPhoto, offert, nonVerifie]) {
    const r = await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT);
    assert.ok(r.ok && r.statut === "masque" && r.pointsRetires === 0, String(id));
  }
  assert.deepEqual(b.points, []);
});

test("masquer : si le retrait des points rate, rien n'est écrit (l'avis reste en relecture) et l'erreur remonte", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  let rappels = 0;
  b.panne.points = true;
  await assert.rejects(b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT, { dansLaTransaction: async () => void rappels++ }), /base indisponible/);
  assert.deepEqual([b.ligne(id).statut, b.points, rappels], ["en-relecture", [], 0], "ni statut, ni points, ni décision écrite");
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: false, erreur: "pas-masque" }, "rien à rendre : il n'a jamais été masqué");
  assert.equal(b.points.length, 0);

  // La base revient : la même décision passe, points compris
  b.panne.points = false;
  assert.deepEqual(await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, statut: "masque", pointsRetires: 10 });
  assert.deepEqual(b.points.map((p) => p.points), [-10]);
});

test("rétablir : si le rendu des points rate, l'avis reste masqué ; jamais plus rendu que retiré", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT);
  b.panne.points = true;
  await assert.rejects(b.gestion.retablirAvis(id, MAINTENANT), /base indisponible/);
  assert.deepEqual([b.ligne(id).statut, b.points.map((p) => p.points), b.defis], ["masque", [-10], []]);
  b.panne.points = false;
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, pointsRendus: 10, aReevaluer: true });
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: false, erreur: "pas-masque" });
  assert.deepEqual(b.points.map((p) => p.points), [-10, 10], "un retrait, un rendu : le compte retrouve ses points, pas un de plus");
});

test("ancien branchement : ajouterPoints est accepté mais jamais appelé ; les points sont refusés en lecture", async () => {
  const appels: unknown[] = [];
  const b = creerBanc({ ajouterPoints: async (...args) => void appels.push(args) });
  const id = await b.avis({ photo: "photo-7.jpg" });
  assert.equal((await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT)).ok, true);
  assert.equal((await b.gestion.retablirAvis(id, MAINTENANT)).ok, true);
  assert.deepEqual([appels, b.points.map((p) => p.points)], [[], [-10, 10]]);
  await assert.rejects(b.memoire.depot.lire((t) => t.poserPointsPhoto(AUTEUR, 10, "lecture")), /hors d'une transaction/);
  assert.equal(b.points.length, 2);
});

test("plancher à 0 : un compte à 3 points masqué passe à 0 (retrait réel 3) ; rétabli, il revient à 3, pas à 10", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  // D'autres retraits sont passés depuis l'écriture (et ses +10) : il ne reste que 3 points au compte
  b.memoire.pointsComptes.set(AUTEUR, 3);
  assert.deepEqual(await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, statut: "masque", pointsRetires: 3 });
  assert.deepEqual([b.total(), b.points.map((p) => [p.points, p.detail])], [0, [[-3, `avis masqué ${id}, lieu 1`]]], "le journal dit le vrai retrait");
  // À 0 point : rien à retirer, rien au journal, donc rien à rendre
  const aZero = await b.avis({ photo: "photo-7.jpg" });
  b.memoire.pointsComptes.set(AUTEUR, 0);
  assert.deepEqual(await b.gestion.trancherAvis(aZero, { action: "masquer" }, MAINTENANT), { ok: true, avisId: aZero, compteId: AUTEUR, lieuId: 1, statut: "masque", pointsRetires: 0 });
  assert.equal(b.points.length, 1);

  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, pointsRendus: 3, aReevaluer: true });
  assert.deepEqual(await b.gestion.retablirAvis(aZero, MAINTENANT), { ok: true, avisId: aZero, compteId: AUTEUR, lieuId: 1, pointsRendus: 0, aReevaluer: true });
  assert.deepEqual([b.total(), b.points.map((p) => p.points)], [3, [-3, 3]], "le compte retrouve ses 3 points, pas un de plus");
});

test("deux rétablissements : un seul rend les points ; même un avis remasqué sans retrait ne rend rien", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT);
  const deux = await Promise.all([b.gestion.retablirAvis(id, MAINTENANT), b.memoire.transaction((tx) => b.gestion.retablirAvisDans(tx, id, MAINTENANT))]);
  assert.deepEqual(deux.filter((r) => r.ok).map((r) => r.ok && r.pointsRendus), [10]);
  assert.deepEqual(deux.filter((r) => !r.ok), [{ ok: false, erreur: "pas-masque" }]);
  assert.deepEqual([b.ligne(id).statut, b.total()], ["publie", POINTS_DEPART + 10], "ses 10 points, posés à l'écriture, retirés puis rendus une fois");

  // L'avis repasse « masque » sans nouveau retrait (une écriture à la main) : le journal dit déjà tout rendu
  b.ligne(id).statut = "masque";
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, pointsRendus: 0, aReevaluer: true });
  assert.deepEqual([b.total(), b.points.map((p) => p.points)], [POINTS_DEPART + 10, [-10, 10]]);
});

test("l'ajout des points à l'écriture a raté : le masquage ne retire rien, le retour en ligne ne rend rien", async () => {
  const b = creerBanc();
  const sansSesPoints = await b.avis({ photo: "photo-7.jpg", pointsEcrits: false });
  const autre = await b.avis({ photo: "photo-8.jpg" });
  assert.deepEqual([b.journal.map((m) => [m.points, m.detail]), b.total()], [[[10, `avis ${autre}, lieu 1`]], POINTS_DEPART + 10], "seul l'autre avis a ses points");

  // Les points de l'autre avis ne paient pas pour celui-ci : rien à retirer, rien au journal, rien à rendre
  assert.deepEqual(await b.gestion.trancherAvis(sansSesPoints, { action: "masquer" }, MAINTENANT),
    { ok: true, avisId: sansSesPoints, compteId: AUTEUR, lieuId: 1, statut: "masque", pointsRetires: 0 });
  assert.deepEqual([b.points, b.total()], [[], POINTS_DEPART + 10]);
  assert.deepEqual(await b.gestion.retablirAvis(sansSesPoints, MAINTENANT),
    { ok: true, avisId: sansSesPoints, compteId: AUTEUR, lieuId: 1, pointsRendus: 0, aReevaluer: true });
  assert.deepEqual([b.ligne(sansSesPoints).statut, b.points, b.total()], ["publie", [], POINTS_DEPART + 10]);

  // L'autre, lui, tient ses 10 points
  assert.deepEqual(await b.gestion.trancherAvis(autre, { action: "masquer" }, MAINTENANT),
    { ok: true, avisId: autre, compteId: AUTEUR, lieuId: 1, statut: "masque", pointsRetires: 10 });
  assert.equal(b.total(), POINTS_DEPART);
});

test("masquer → rétablir → remis en relecture à la main → masquer : chaque retrait plafonné par ce que l'avis tient encore", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  const masquer = async () => {
    const r = await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT);
    assert.ok(r.ok && r.statut === "masque");
    return r.pointsRetires;
  };
  /** Une écriture à la main (dans la base, ou ici dans le double) : l'avis repasse en relecture, sans toucher aux points */
  const remettreEnRelecture = () => void (b.ligne(id).statut = "en-relecture");

  assert.equal(await masquer(), 10);
  assert.equal((await b.gestion.retablirAvis(id, MAINTENANT)).ok, true);
  remettreEnRelecture();
  assert.equal(await masquer(), 10, "rétabli, il tenait de nouveau ses 10 points");
  assert.equal(b.total(), POINTS_DEPART);

  // Remis en relecture SANS retour en ligne : il ne tient plus rien, le masquage suivant ne retire rien
  remettreEnRelecture();
  assert.equal(await masquer(), 0, "jamais deux retraits pour un seul gain");
  assert.equal(b.total(), POINTS_DEPART);

  // Le retour en ligne rend ce que le journal dit retiré, moins ce qui a déjà été rendu : ses 10 points, pas un de plus
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, pointsRendus: 10, aReevaluer: true });
  const masque = `avis masqué ${id}, lieu 1`;
  const retabli = `avis rétabli ${id}, lieu 1`;
  assert.deepEqual([b.total(), b.points.map((p) => [p.points, p.detail])], [POINTS_DEPART + 10, [[-10, masque], [10, retabli], [-10, masque], [10, retabli]]]);
});

test("plafond : masqué à 3 points (retrait 3), remis en relecture, le compte remonte : le masquage suivant retire 7, pas 10", async () => {
  const b = creerBanc();
  const id = await b.avis({ photo: "photo-7.jpg" });
  b.memoire.pointsComptes.set(AUTEUR, 3);
  assert.deepEqual(await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, statut: "masque", pointsRetires: 3 });
  // Remis en relecture à la main ; entre-temps, le compte a regagné des points ailleurs
  b.ligne(id).statut = "en-relecture";
  b.memoire.pointsComptes.set(AUTEUR, 50);
  assert.deepEqual(await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, statut: "masque", pointsRetires: 7 });
  assert.equal(b.total(), 43, "10 retirés en tout pour ses 10 points gagnés");

  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, pointsRendus: 10, aReevaluer: true });
  assert.deepEqual([b.total(), b.points.map((p) => p.points)], [53, [-3, -7, 10]]);
});
