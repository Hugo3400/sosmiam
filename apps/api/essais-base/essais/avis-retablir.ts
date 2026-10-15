// Essai sur base des décisions de l'équipe sur les avis (services/avis-gestion.ts), seconde moitié (la première :
// avis-decisions.ts ; la mise en place et la limite de PGlite : preparations/preparer-essai-avis.ts). Vérifie : (e)
// retablirAvisDans dans la transaction du réexamen (celle du logiciel, comme deciderSignalement) : verrou du compte, défait
// avec elle, « pas-masque » rendu sans casser la transaction, un seul rendu, défis après par apresRetablir ; (f) le retrait
// plafonné par ce que l'avis tient encore d'après le journal (ajout raté à l'écriture, masquer → rétablir → remis en
// relecture → masquer, retrait partiel), et par la règle (deux lignes d'écriture : 10 retirés, pas 20) ; (g) l'écriture par
// le vrai donnerAvis d'avis-client.ts : la ligne de +10 est là DANS la transaction de l'avis, défaite avec lui, et une panne
// pendant les points n'écrit ni avis ni points (la visite reste à noter). Aucune vraie base.
import "../socle/garde-fou.ts";
import assert from "node:assert/strict";
import type { DepotAvis } from "../../src/services/avis-regles.ts";
import { preparerEssaiAvis } from "../preparations/preparer-essai-avis.ts";
import { terminerEssai } from "../socle/verifications.ts";

const {
  essai, baseDeDonnees, verifications, egal, rejette, sql, T, horloge, AUTEUR, PAUVRE, GERANT, LIEU, creerAvisClient, depot, defisNotes, gestion, pro,
  ecrireAvis, poserTotal, statut, points, journal, lireVerrou, VERROU_PRIS, ecrireDecision, panne,
} = await preparerEssaiAvis();

// Comme à la fin de avis-decisions.ts : un avis publié (a3), et un avis publié dont la réponse du lieu a été masquée puis
// rétablie (a10)
const REPONSE = "Merci moussaillon, on t'attend pour la prochaine fournée !";
const a3 = await ecrireAvis(AUTEUR, { photo: "photo-3.jpg" });
egal((await gestion.trancherAvis(a3, { action: "publier" }, T)).ok, true, "a3 publié");
const a10 = await ecrireAvis(AUTEUR, { statut: "publie", raisonRelecture: null });
egal((await pro.repondre(GERANT, a10, REPONSE)).ok, true, "a10 : la réponse du lieu");
egal((await gestion.trancherReponseAvis(a10, { action: "masquer" }, T)).ok, true);
egal((await gestion.retablirReponseAvis(a10, T)).ok, true);

// ---------- (e) retablirAvisDans : dans la transaction du réexamen ----------
const e1 = await ecrireAvis(AUTEUR, { photo: "photo-e1.jpg" });
egal((await gestion.trancherAvis(e1, { action: "masquer" }, T, { dansLaTransaction: ecrireDecision })).ok, true);
const decisionE1 = (await sql<{ id: number }>(`SELECT id FROM signalements WHERE cible = 'avis' AND cible_id = $1`, String(e1)))[0]!.id;
const lireDecision = async (id: number) => (await sql<{ statut: string; decision: string | null }>(`SELECT statut, decision FROM signalements WHERE id = $1`, id))[0];
const pE = await points(AUTEUR);
const lignesE = (await journal(AUTEUR)).length;
defisNotes.length = 0;
/** Comme deciderSignalement (réexamen qui donne raison à l'auteur) : le rétablissement d'abord, puis sa décision, dans SA transaction */
const reexaminer = (avisId: number, signalementId: number, ensuite?: (tx: any) => Promise<void>) => baseDeDonnees.$transaction(async (tx: any) => {
  const r = await gestion.retablirAvisDans(tx, avisId, T);
  await tx.signalement.updateMany({ where: { id: signalementId }, data: { statut: "rejete", motif: null, reexamineLe: T } });
  await ensuite?.(tx);
  return r;
});
const etatE1 = async () => [await statut(e1), await points(AUTEUR), (await journal(AUTEUR)).length, (await lireDecision(decisionE1))!.statut];

// Le verrou du compte, dans une transaction de l'appelant qui n'insère RIEN (une insertion au journal poserait elle aussi un
// RowShareLock sur comptes, par sa clé étrangère) : retablirAvisDans sur un avis publié rend « pas-masque » sans écrire, et
// la ligne du compte de l'auteur porte alors le FOR UPDATE de CETTE transaction
egal(await baseDeDonnees.$transaction(async (tx: any) => [await gestion.retablirAvisDans(tx, a3, T), await lireVerrou(tx, AUTEUR)]),
  [{ ok: false, erreur: "pas-masque" }, VERROU_PRIS], "retablirAvisDans verrouille le compte de l'auteur, même sans rien écrire");
egal(await baseDeDonnees.$transaction(async (tx: any) => [await gestion.retablirReponseAvisDans(tx, a10, T), await lireVerrou(tx, AUTEUR)]),
  [{ ok: false, erreur: "pas-masque" }, VERROU_PRIS], "retablirReponseAvisDans aussi (le compte de l'auteur de l'avis)");
// Témoins de la lecture : sans verrou, rien à cette transaction ; une insertion au journal (clé étrangère) laisse bien un
// RowShareLock sur la table, mais un FOR KEY SHARE sur la ligne, pas un FOR UPDATE
const temoin = await baseDeDonnees.$transaction(async (tx: any) => lireVerrou(tx, AUTEUR));
egal([temoin.parMoi, temoin.tableRowShare], [false, false], "sans verrou : ni xmax à elle, ni RowShareLock");
let parInsertion: unknown = null;
await rejette(baseDeDonnees.$transaction(async (tx: any) => {
  await tx.$executeRawUnsafe(`INSERT INTO journal_points (compte_id, points, raison, detail) VALUES ($1, 0, 'essai', 'témoin')`, AUTEUR);
  parInsertion = await lireVerrou(tx, AUTEUR);
  throw new Error("témoin défait");
}), /témoin défait/);
egal(parInsertion, { parMoi: true, forUpdate: false, tableRowShare: true }, "l'insertion seule : RowShareLock, mais pas FOR UPDATE");

// La transaction du réexamen lève après coup : rien n'est rétabli (ni statut, ni points, ni journal, ni décision)
let vuE: unknown = null;
await rejette(reexaminer(e1, decisionE1, async (tx) => {
  vuE = [(await tx.avis.findUniqueOrThrow({ where: { id: e1 }, select: { statut: true } })).statut, (await tx.compte.findUniqueOrThrow({ where: { id: AUTEUR }, select: { points: true } })).points];
  throw new Error("réexamen impossible");
}), /réexamen impossible/);
egal(vuE, ["publie", pE + 10], "dans la transaction de l'appelant : rétabli, points rendus");
egal([...(await etatE1()), defisNotes], ["masque", pE, lignesE, "retenu", []], "le réexamen a levé : tout est défait, pas de défis");

// Une vraie erreur de la base pendant le rendu : elle lève, et la décision de l'appelant est défaite avec
await panne("avis rétabli");
await rejette(reexaminer(e1, decisionE1), /journal des points indisponible/);
egal(await etatE1(), ["masque", pE, lignesE, "retenu"]);
await panne(null);

// « pas-masque » et « introuvable » : rendus sans lever, et la transaction reste utilisable (la suite est validée)
const sansEffet = await baseDeDonnees.$transaction(async (tx: any) => {
  const rendus = [await gestion.retablirAvisDans(tx, a3, T), await gestion.retablirAvisDans(tx, 999_999, T), await gestion.retablirReponseAvisDans(tx, a3, T)];
  await tx.signalement.updateMany({ where: { id: decisionE1 }, data: { decision: "écrit après, même transaction" } });
  return rendus;
});
egal(sansEffet, [{ ok: false, erreur: "pas-masque" }, { ok: false, erreur: "introuvable" }, { ok: false, erreur: "introuvable" }]);
egal((await lireDecision(decisionE1))!.decision, "écrit après, même transaction", "la transaction de l'appelant n'est pas cassée");

// Validée : rétabli avec la décision ; les défis attendent apresRetablir
const rE = await reexaminer(e1, decisionE1);
egal(rE, { ok: true, avisId: e1, compteId: AUTEUR, lieuId: LIEU, pointsRendus: 10, aReevaluer: true });
egal([...(await etatE1()), (await journal(AUTEUR)).at(-1), defisNotes], ["publie", pE + 10, lignesE + 1, "rejete", [10, `avis rétabli ${e1}, lieu ${LIEU}`], []]);
await gestion.apresRetablir(rE, T);
egal(defisNotes, [AUTEUR], "défis relancés après la validation");

// Deux rétablissements : le deuxième ne passe pas ; remasqué à la main (sans retrait), le retour en ligne ne rend rien
egal(await baseDeDonnees.$transaction((tx: any) => gestion.retablirAvisDans(tx, e1, T)), { ok: false, erreur: "pas-masque" });
await baseDeDonnees.$executeRawUnsafe(`UPDATE avis SET statut = 'masque' WHERE id = $1`, e1);
egal(await baseDeDonnees.$transaction((tx: any) => gestion.retablirAvisDans(tx, e1, T)), { ok: true, avisId: e1, compteId: AUTEUR, lieuId: LIEU, pointsRendus: 0, aReevaluer: true });
egal([await points(AUTEUR), (await journal(AUTEUR)).length], [pE + 10, lignesE + 1], "jamais rendu deux fois");

// En même temps, par le logiciel (sa transaction) et par retablirAvis : un seul passe, un seul rendu
const e2 = await ecrireAvis(AUTEUR, { photo: "photo-e2.jpg" });
await gestion.trancherAvis(e2, { action: "masquer" }, T);
const pE2 = await points(AUTEUR);
const course = await Promise.all([gestion.retablirAvis(e2, T), baseDeDonnees.$transaction((tx: any) => gestion.retablirAvisDans(tx, e2, T))]);
egal([course.filter((r) => r.ok).length, course.filter((r) => !r.ok).map((r) => r.erreur)], [1, ["pas-masque"]]);
egal(await points(AUTEUR), pE2 + 10);

// La réponse d'un lieu : défaite avec la transaction de l'appelant, sinon rétablie
const e3 = await ecrireAvis(AUTEUR, { statut: "publie", raisonRelecture: null });
egal((await pro.repondre(GERANT, e3, REPONSE)).ok, true);
egal((await gestion.trancherReponseAvis(e3, { action: "masquer" }, T)).ok, true);
const reponseStatut = async (id: number) => (await sql<{ reponse_statut: string }>(`SELECT reponse_statut FROM avis WHERE id = $1`, id))[0]!.reponse_statut;
await rejette(baseDeDonnees.$transaction(async (tx: any) => {
  egal((await gestion.retablirReponseAvisDans(tx, e3, T)).ok, true);
  throw new Error("réexamen impossible");
}), /réexamen impossible/);
egal(await reponseStatut(e3), "masquee");
egal(await baseDeDonnees.$transaction((tx: any) => gestion.retablirReponseAvisDans(tx, e3, T)), { ok: true, avisId: e3, compteId: GERANT, lieuId: LIEU, pointsRendus: 0, aReevaluer: false });
egal(await reponseStatut(e3), "publiee");

// ---------- (f) le retrait plafonné par ce que l'avis tient encore d'après le journal ----------
const remettreEnRelecture = (id: number) => baseDeDonnees.$executeRawUnsafe(`UPDATE avis SET statut = 'en-relecture' WHERE id = $1`, id);
const retraitDe = async (id: number) => {
  const r = await gestion.trancherAvis(id, { action: "masquer" }, T);
  assert.ok(r.ok && r.statut === "masque");
  return r.pointsRetires;
};
const lignesDe = async (compteId: number, id: number) => (await journal(compteId)).filter(([, d]) => String(d).endsWith(` ${id}, lieu ${LIEU}`)).map(([p]) => p);

// L'ajout des points a raté à l'écriture (aucune ligne « avis <id>, lieu <lieuId> ») : le masquage ne retire rien, même si
// le compte a les points d'autres avis, et le retour en ligne ne rend rien
const f1 = await ecrireAvis(AUTEUR, { photo: "photo-f1.jpg", pointsEcrits: false });
const pF1 = await points(AUTEUR);
egal(await gestion.trancherAvis(f1, { action: "masquer" }, T), { ok: true, avisId: f1, compteId: AUTEUR, lieuId: LIEU, statut: "masque", pointsRetires: 0 });
egal(await gestion.retablirAvis(f1, T), { ok: true, avisId: f1, compteId: AUTEUR, lieuId: LIEU, pointsRendus: 0, aReevaluer: true });
egal([await statut(f1), await points(AUTEUR), await lignesDe(AUTEUR, f1)], ["publie", pF1, []], "rien au journal, le total n'a pas bougé");

// masquer → rétablir → remis en relecture (à la main, dans la base) → masquer : le 2e retrait est de 10 (rétabli, il les
// tenait de nouveau) ; remis en relecture sans retour en ligne, le 3e ne retire rien ; le retour en ligne rend 10, pas 20
const f2 = await ecrireAvis(AUTEUR, { photo: "photo-f2.jpg" });
const pF2 = await points(AUTEUR);
egal(await retraitDe(f2), 10);
egal((await gestion.retablirAvis(f2, T)).ok, true);
await remettreEnRelecture(f2);
egal(await retraitDe(f2), 10, "rétabli, il tenait de nouveau ses 10 points");
await remettreEnRelecture(f2);
egal(await retraitDe(f2), 0, "jamais deux retraits pour un seul gain");
egal(await points(AUTEUR), pF2 - 10);
egal(await gestion.retablirAvis(f2, T), { ok: true, avisId: f2, compteId: AUTEUR, lieuId: LIEU, pointsRendus: 10, aReevaluer: true });
egal([await points(AUTEUR), await lignesDe(AUTEUR, f2)], [pF2, [10, -10, 10, -10, 10]], "il retrouve ses 10 points, pas un de plus");

// Retrait partiel : un compte à 3 points perd 3 ; remis en relecture, le compte remonte à 50 : le masquage suivant retire 7
const f3 = await ecrireAvis(PAUVRE, { photo: "photo-f3.jpg" });
await poserTotal(PAUVRE, 3);
egal(await retraitDe(f3), 3, "compte à 3 points : retrait 3");
await remettreEnRelecture(f3);
await poserTotal(PAUVRE, 50);
egal(await retraitDe(f3), 7, "ce que l'avis tenait encore, pas 10");
egal(await gestion.retablirAvis(f3, T), { ok: true, avisId: f3, compteId: PAUVRE, lieuId: LIEU, pointsRendus: 10, aReevaluer: true });
egal([await points(PAUVRE), await lignesDe(PAUVRE, f3)], [53, [10, -3, -7, 10]]);

// Le terme « règle » du plafond : deux lignes « avis <id>, lieu <lieuId> » de +10 pour un même avis (rejouée à la main) ;
// il « tient » 20 d'après le journal, le compte a de quoi, mais le masquage retire 10, pas 20
const f4 = await ecrireAvis(AUTEUR, { photo: "photo-f4.jpg" });
await depot.ecrire((t) => t.poserPointsPhoto(AUTEUR, 10, `avis ${f4}, lieu ${LIEU}`));
const pF4 = await points(AUTEUR);
egal(await retraitDe(f4), 10, "la règle plafonne : 10, pas 20");
egal([await points(AUTEUR), await lignesDe(AUTEUR, f4)], [pF4 - 10, [10, 10, -10]]);

// ---------- (g) l'écriture d'un avis vérifié avec photo (donnerAvis) : ses +10 dans la MÊME transaction ----------
const HEURE = 3600_000;
/** Une visite validée de ce compte, payée, dont l'avis est ouvert à T */
const visiteOuverte = async (compteId: number) => (await baseDeDonnees.visite.create({
  data: {
    compteId, lieuId: LIEU, mode: "comptoir", statut: "validee", valideLe: new Date(T.getTime() - 2 * HEURE), avisOuvertLe: new Date(T.getTime() - HEURE),
    avisFermeLe: new Date(T.getTime() + 14 * 24 * HEURE), reglement: { type: "paye", reductionPourcent: null, avantages: [] },
  } as never,
})).id;
const NOUVEL = { note: 4, texte: "Les crêpes du Capitaine, la Brigade valide.", photo: "photo-g.jpg" };
const avisDeVisite = async (visiteId: number) => (await sql<{ id: number }>(`SELECT id FROM avis WHERE visite_id = $1`, visiteId)).map((l) => l.id);
const avisDonne = async (visiteId: number) => (await sql<{ avis_donne: boolean }>(`SELECT avis_donne FROM visites WHERE id = $1`, visiteId))[0]!.avis_donne;
/** Le même dépôt, dont la transaction peut lever tout à la fin (après tout ce qu'elle a écrit), en gardant ce qu'elle voyait */
const finTransaction = { panne: false, vu: null as unknown };
const depotEspion: DepotAvis = {
  ...depot,
  ecrire: (fn) => depot.ecrire(async (t) => {
    const r = await fn(t);
    if (!finTransaction.panne) return r;
    const lus = await t.brut!.$queryRawUnsafe<{ id: number }[]>(`SELECT id FROM avis WHERE visite_id = $1`, g1);
    const lignes = await t.brut!.$queryRawUnsafe<{ points: number; detail: string }[]>(`SELECT points, detail FROM journal_points WHERE compte_id = $1 AND raison = 'avis-photo' ORDER BY id`, AUTEUR);
    const compte = await t.brut!.compte.findUniqueOrThrow({ where: { id: AUTEUR }, select: { points: true } });
    finTransaction.vu = { avis: lus.map((l) => l.id), derniere: lignes.map((l) => [l.points, l.detail]).at(-1), points: compte.points };
    throw new Error("transaction interrompue");
  }),
};
// tirer → 0 : en relecture même pour un compte de plus de 7 jours (le masquage qui suit en a besoin)
const clientG = creerAvisClient({ depot: depotEspion, chiffrement: null, tirer: () => 0, horloge });
const g1 = await visiteOuverte(AUTEUR);
const pG = await points(AUTEUR);
const lignesG = (await journal(AUTEUR)).length;
const etatG = async () => [await avisDeVisite(g1), await avisDonne(g1), await points(AUTEUR), (await journal(AUTEUR)).length];

// La transaction lève après tout ce qu'elle a écrit : par elle, l'avis et sa ligne de +10 sont déjà là ; puis tout part
finTransaction.panne = true;
await rejette(clientG.donnerAvis(AUTEUR, { visiteId: g1, ...NOUVEL }), /transaction interrompue/);
finTransaction.panne = false;
const vuG = finTransaction.vu as { avis: number[] };
egal(finTransaction.vu, { avis: [vuG.avis[0]], derniere: [10, `avis ${vuG.avis[0]}, lieu ${LIEU}`], points: pG + 10 }, "dans la transaction de l'avis : sa ligne de +10");
egal(await etatG(), [[], false, pG, lignesG], "défaits ensemble : ni avis, ni points, la visite reste à noter");

// Une panne de la base pendant les points : l'avis n'est pas écrit non plus
await panne("avis ");
await rejette(clientG.donnerAvis(AUTEUR, { visiteId: g1, ...NOUVEL }), /journal des points indisponible/);
await panne(null);
egal(await etatG(), [[], false, pG, lignesG], "points refusés : ni avis ni points");

// La base revient : l'avis passe avec ses +10 ; masqué ensuite, il les rend (il les tient d'après le journal)
egal(await clientG.donnerAvis(AUTEUR, { visiteId: g1, ...NOUVEL }).then((r: { ok: boolean; pointsGagnes?: number }) => [r.ok, r.pointsGagnes]), [true, 10]);
const [g1Avis] = await avisDeVisite(g1);
egal([await avisDonne(g1), await points(AUTEUR), (await journal(AUTEUR)).slice(lignesG), await statut(g1Avis!)],
  [true, pG + 10, [[10, `avis ${g1Avis}, lieu ${LIEU}`]], "en-relecture"]);
egal(await gestion.trancherAvis(g1Avis!, { action: "masquer" }, T), { ok: true, avisId: g1Avis, compteId: AUTEUR, lieuId: LIEU, statut: "masque", pointsRetires: 10 });
egal(await points(AUTEUR), pG);

await terminerEssai(import.meta.url, essai, verifications.nombre);
