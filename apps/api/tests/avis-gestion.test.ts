// Tests des décisions de l'équipe sur les avis et les réponses des lieux (services/avis-gestion.ts), appelées par le logiciel
// de gestion : statut changé une seule fois, points de la photo retirés puis rendus DANS la transaction du statut (tout ou
// rien), défis relancés après, rappel dans la transaction. Aucune base de données : avis en mémoire, mouvements de points
// notés par le double (pointsPhoto), défis notés au lieu d'être réévalués. La vraie base : essai PGlite hors ligne
// (creerDepotAvis().ecrire avec le vrai client Prisma et toutes les migrations).
import assert from "node:assert/strict";
import { test } from "node:test";

import { resumerAvis } from "../../../packages/commun/src/fonctions/avis/resumer-avis.ts";
import { creerAvisClient } from "../src/services/avis-client.ts";
import { creerAvisEnMemoire } from "../src/services/avis-en-memoire.ts";
import { creerAvisGestion, type DependancesAvisGestion } from "../src/services/avis-gestion.ts";
import { creerAvisPro } from "../src/services/avis-pro.ts";
import type { DepotAvis, NouvelleLigneAvis } from "../src/services/avis-regles.ts";

const T0 = new Date("2026-10-15T09:00:00Z");
const MAINTENANT = new Date("2026-10-16T14:00:00Z");
/** L'auteur des avis, et le gérant du lieu 1 (celui qui répond) */
const AUTEUR = 7;
const GERANT = 50;
const REPONSE = "Merci pour ton passage, on t'attend pour la prochaine fournée de crêpes !";

function creerBanc(o: { ajouterPoints?: DependancesAvisGestion["ajouterPoints"] } = {}) {
  const memoire = creerAvisEnMemoire();
  memoire.lieux.set(1, { id: 1, nom: "Chez Léa", emoji: "🍝", type: "resto", ville: "Montpellier", publie: true, verifie: true });
  /** Les mouvements de points de la photo, écrits dans les transactions (défaits avec elles) */
  const points = memoire.pointsPhoto;
  const defis: { compteId: number; maintenant: Date }[] = [];
  /** Pannes à la demande : les points (dans la transaction) ou la réévaluation des défis (après) */
  const panne = { points: false, defis: false };
  const depot: DepotAvis = {
    lire: memoire.depot.lire,
    ecrire: (fn) => memoire.depot.ecrire((t) => fn({
      ...t,
      poserPointsPhoto: async (...args) => {
        if (panne.points) throw new Error("base indisponible");
        return t.poserPointsPhoto(...args);
      },
    })),
  };
  const gestion = creerAvisGestion({
    depot,
    ...(o.ajouterPoints ? { ajouterPoints: o.ajouterPoints } : {}),
    reevaluerDefis: async (compteId, maintenant) => {
      if (panne.defis) throw new Error("défis indisponibles");
      defis.push({ compteId, maintenant });
    },
  });
  const horloge = () => MAINTENANT.getTime();
  const client = creerAvisClient({ depot: memoire.depot, chiffrement: null, tirer: () => 7, horloge });
  const pro = creerAvisPro({ depot: memoire.depot, horloge }, async (compteId, lieuId) => (compteId === GERANT && lieuId === 1 ? "gerant" : null));
  let visites = 0;

  /** Un avis du lieu 1, en relecture par défaut ; verifie : écrit grâce à une visite (une nouvelle à chaque fois) */
  const avis = async (champs: Partial<NouvelleLigneAvis> & { verifie?: boolean } = {}) => {
    const { verifie = true, ...reste } = champs;
    return (await memoire.depot.ecrire((t) => t.creerAvis({
      compteId: AUTEUR, lieuId: 1, visiteId: verifie ? ++visites : null, note: 4, texte: "Très bonne adresse, on reviendra.", photo: null,
      signature: "Léa M.", statut: "en-relecture", raisonRelecture: "tirage", repasOffert: false, creeLe: T0, ...reste,
    }))).id;
  };
  /** La ligne gardée (statut, réponse) */
  const ligne = (id: number) => memoire.avis.find((a) => a.id === id)!;
  /** Les identifiants des avis de la page publique, et son résumé */
  const pagePublique = async () => {
    const r = await client.lireAvisLieu(1, null);
    assert.ok(r.ok);
    return { ids: r.avis.map((a) => a.id), resume: r.resume, avis: r.avis };
  };
  /** La page du comptoir vue par le gérant */
  const comptoir = async () => {
    const r = await pro.lister(GERANT, 1, null);
    assert.ok(r.ok);
    return r.avis;
  };
  /** Le gérant répond à cet avis (posée « en-relecture ») */
  const repondre = async (id: number) => assert.ok((await pro.repondre(GERANT, id, REPONSE)).ok);
  return { memoire, gestion, pro, points, defis, panne, avis, ligne, pagePublique, comptoir, repondre };
}

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
  assert.deepEqual(b.defis, []);
  assert.deepEqual(await b.gestion.trancherAvis(id, { action: "masquer" }, MAINTENANT), { ok: false, erreur: "deja-tranche", statut: "masque" });
  assert.equal(b.points.length, 1, "jamais retirés deux fois");
  // Masqué, il n'accepte plus de réponse du lieu
  assert.deepEqual(await b.pro.repondre(GERANT, id, REPONSE), { ok: false, erreur: "introuvable" });
});

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
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, pointsRendus: 10 });
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: false, erreur: "pas-masque" });
  assert.deepEqual(b.points.map((p) => p.points), [-10, 10], "un retrait, un rendu : le compte retrouve ses points, pas un de plus");
});

test("défis : une réévaluation qui rate après coup est notée au journal ; statut et points restent écrits", async (t) => {
  const journal = t.mock.method(console, "error", () => {});
  const b = creerBanc();
  b.panne.defis = true;
  const publie = await b.avis({ photo: "photo-7.jpg" });
  assert.equal((await b.gestion.trancherAvis(publie, { action: "publier" }, MAINTENANT)).ok, true);
  const masque = await b.avis({ photo: "photo-7.jpg" });
  await b.gestion.trancherAvis(masque, { action: "masquer" }, MAINTENANT);
  assert.deepEqual(await b.gestion.retablirAvis(masque, MAINTENANT), { ok: true, avisId: masque, compteId: AUTEUR, lieuId: 1, pointsRendus: 10 });
  assert.deepEqual([b.ligne(publie).statut, b.ligne(masque).statut, b.points.map((p) => p.points)], ["publie", "publie", [-10, 10]]);
  assert.equal(journal.mock.callCount(), 2, "la publication et le retour en ligne");
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
  assert.deepEqual(await b.gestion.retablirAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: AUTEUR, lieuId: 1, pointsRendus: 10 });
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
  assert.deepEqual(await b.gestion.retablirAvis(nonVerifie, MAINTENANT), { ok: true, avisId: nonVerifie, compteId: AUTEUR, lieuId: 1, pointsRendus: 0 });
  assert.deepEqual([b.points.length, b.defis.length], [2, 1]);
});

test("rétablir une réponse : masquée → publiée, sans points ; sinon pas-masque ou introuvable", async () => {
  const b = creerBanc();
  const id = await b.avis({ statut: "publie" });
  await b.repondre(id);
  assert.deepEqual(await b.gestion.retablirReponseAvis(id, MAINTENANT), { ok: false, erreur: "pas-masque" });
  await b.gestion.trancherReponseAvis(id, { action: "masquer" }, MAINTENANT);
  assert.deepEqual(await b.gestion.retablirReponseAvis(id, MAINTENANT), { ok: true, avisId: id, compteId: GERANT, lieuId: 1, pointsRendus: 0 });
  assert.equal(b.ligne(id).reponseStatut, "publiee");
  assert.equal((await b.pagePublique()).avis[0]!.reponseLieu?.texte, REPONSE);
  assert.deepEqual(await b.gestion.retablirReponseAvis(id, MAINTENANT), { ok: false, erreur: "pas-masque" });
  assert.deepEqual(await b.gestion.retablirReponseAvis(await b.avis(), MAINTENANT), { ok: false, erreur: "introuvable" });
  assert.deepEqual([b.points, b.defis], [[], []]);
});
