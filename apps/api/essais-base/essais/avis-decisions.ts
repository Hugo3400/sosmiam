// Essai sur base des décisions de l'équipe sur les avis (services/avis-gestion.ts), première moitié : PGlite, toutes les
// migrations du dépôt, le vrai client Prisma (connexion.ts) et creerDepotAvis() de services/avis.ts. Chaque avis vérifié avec
// photo reçoit ses +10 dans la transaction qui l'écrit, comme avis-client.ts (poserPointsPhoto, détail « avis <id>, lieu
// <lieuId> »). Vérifie : (a) brut est bien la transaction d'ecrire (une ligne écrite par lui part ou reste avec le statut et
// les points) ; (b) deux décisions en même temps : une seule passe ; (c) masquer puis rétablir un avis vérifié avec photo :
// −10 puis +10, dans les mêmes transactions que les statuts, et le plancher à 0 (un compte à 3 points perd 3 et les
// retrouve) ; (d) une réponse posée est « en-relecture » et visible. La décision écrite au masquage vient de
// construireDecisionAvis (fonctions/avis), relue colonne par colonne. La suite (e, f, g) : avis-retablir.ts ; la mise en
// place et la limite de PGlite (une session) : preparations/preparer-essai-avis.ts. Aucune vraie base.
import "../socle/garde-fou.ts";
import assert from "node:assert/strict";
import { ajouterPointsDans, donnerBadge } from "../../src/services/comptes.ts";
import type { DepotAvis } from "../../src/services/avis-regles.ts";
import { creerDefis } from "../../src/services/defis.ts";
import { preparerEssaiAvis } from "../preparations/preparer-essai-avis.ts";
import { terminerEssai } from "../socle/verifications.ts";

const {
  essai, baseDeDonnees, verifications, egal, rejette, sql, T, AUTEUR, PAUVRE, GERANT, LIEU, creerAvisGestion, depot, defisNotes, gestion, client, pro,
  ecrireAvis, poserTotal, statut, points, journal, lireVerrou, VERROU_PRIS, signalements, MOTIVATION, ecrireDecision, panne,
} = await preparerEssaiAvis();

// ---------- (a) brut est la transaction d'ecrire ----------
egal(await depot.lire(async (t) => t.brut), null, "en lecture, pas de transaction à prêter");
await rejette(depot.lire((t) => t.poserPointsPhoto(AUTEUR, 10, "lecture")), /hors d'une transaction/);
egal(await depot.ecrire(async (t) => t.brut !== null && t.brut !== baseDeDonnees), true, "en écriture : la transaction, pas le client global");

const a1 = await ecrireAvis(AUTEUR, { photo: "photo-1.jpg" });
let vuDedans: unknown = null;
await rejette(gestion.trancherAvis(a1, { action: "masquer" }, T, {
  dansLaTransaction: async (tx, r) => {
    await ecrireDecision(tx, r);
    // Par tx : le statut, les points et le journal déjà écrits (pas encore validés), et la décision qu'on vient d'écrire
    const lu = await tx!.avis.findUniqueOrThrow({ where: { id: r.avisId }, select: { statut: true } });
    const compte = await tx!.compte.findUniqueOrThrow({ where: { id: AUTEUR }, select: { points: true } });
    const lignes = await tx!.journalPoints.count({ where: { compteId: AUTEUR, raison: "avis-photo" } });
    vuDedans = [lu.statut, compte.points, lignes, await tx!.signalement.count({ where: { cible: "avis", cibleId: String(r.avisId) } })];
    throw new Error("décision impossible");
  },
}), /décision impossible/);
egal(vuDedans, ["masque", 100, 2, 1], "dans la transaction : statut, points (110 avec la photo, −10), journal et décision écrits ensemble");
egal([await statut(a1), await points(AUTEUR), await journal(AUTEUR), await signalements(a1)], ["en-relecture", 110, [[10, `avis ${a1}, lieu ${LIEU}`]], 0], "le rappel a levé : tout est défait, la ligne écrite par brut aussi");

const ok1 = await gestion.trancherAvis(a1, { action: "masquer" }, T, { dansLaTransaction: ecrireDecision });
egal(ok1, { ok: true, avisId: a1, compteId: AUTEUR, lieuId: LIEU, statut: "masque", pointsRetires: 10 });
egal([await statut(a1), await points(AUTEUR), await journal(AUTEUR), await signalements(a1)], ["masque", 100, [[10, `avis ${a1}, lieu ${LIEU}`], [-10, `avis masqué ${a1}, lieu ${LIEU}`]], 1], "validé : tout ensemble");
egal(await sql(`SELECT cible, cible_id, lieu_id, raison, precision, explication, source, statut, decision, motif, motivation, traite_le, signale_par_id, auteur_contenu_id, contestation, conteste_le, reexamine_le FROM signalements WHERE cible = 'avis' AND cible_id = $1`, String(a1)), [{
  cible: "avis", cible_id: String(a1), lieu_id: LIEU, raison: "relecture", precision: null, explication: "", source: "equipe", statut: "retenu", decision: null,
  motif: "fausse-info", motivation: MOTIVATION, traite_le: T, signale_par_id: null, auteur_contenu_id: AUTEUR, contestation: null, conteste_le: null, reexamine_le: null,
}], "construireDecisionAvis : la ligne écrite, colonne par colonne");

// Une panne de la base sur les points : ni statut, ni décision écrite (le rappel n'est même pas appelé)
const a2 = await ecrireAvis(AUTEUR, { photo: "photo-2.jpg" });
await panne("avis masqué");
let rappels = 0;
await rejette(gestion.trancherAvis(a2, { action: "masquer" }, T, { dansLaTransaction: async (tx, r) => { rappels++; await ecrireDecision(tx, r); } }), /journal des points indisponible/);
egal([await statut(a2), await points(AUTEUR), (await journal(AUTEUR)).length, await signalements(a2), rappels], ["en-relecture", 110, 3, 0, 0], "points refusés : rien n'est écrit");
await panne(null);
egal((await gestion.trancherAvis(a2, { action: "masquer" }, T)).ok, true, "la base revient : la décision passe");
egal([await statut(a2), await points(AUTEUR), (await journal(AUTEUR)).at(-1)], ["masque", 100, [-10, `avis masqué ${a2}, lieu ${LIEU}`]]);

// ---------- (b) deux décisions en même temps ----------
// Le verrou du compte est bien pris (publier n'insère rien : seul le SELECT … FOR UPDATE peut l'avoir posé)
const a3 = await ecrireAvis(AUTEUR, { photo: "photo-3.jpg" });
let verrous: string[] = [];
let verrouA3: unknown = null;
await gestion.trancherAvis(a3, { action: "publier" }, T, {
  dansLaTransaction: async (tx) => {
    verrous = (await tx!.$queryRawUnsafe<{ mode: string }[]>(`SELECT mode FROM pg_locks WHERE relation = 'comptes'::regclass AND pid = pg_backend_pid() ORDER BY mode`)).map((l) => l.mode);
    verrouA3 = await lireVerrou(tx, AUTEUR);
  },
});
egal(verrous, ["RowShareLock"], "le compte de l'auteur est verrouillé, sans écriture des points");
egal(verrouA3, VERROU_PRIS, "la ligne du compte : FOR UPDATE, par cette transaction");
egal([await statut(a3), await points(AUTEUR), defisNotes], ["publie", 110, [AUTEUR]], "publié : pas de points (ceux de l'écriture restent), défis relancés après");

// Plusieurs avis, trois décisions concurrentes chacun (deux connexions ou plus) : une seule passe par avis
const lot = [];
for (let i = 0; i < 8; i++) lot.push(await ecrireAvis(AUTEUR, { photo: `photo-lot-${i}.jpg` }));
const avantLot = await points(AUTEUR);
const lignesAvantLot = (await journal(AUTEUR)).length;
let rappelsLot = 0;
const o = { dansLaTransaction: async (tx: any, r: { avisId: number; lieuId: number; compteId: number | null }) => { rappelsLot++; await ecrireDecision(tx, r); } };
const resultats = await Promise.all(lot.flatMap((id, i) => {
  const ordre = i % 2 === 0 ? (["masquer", "publier", "masquer"] as const) : (["publier", "masquer", "publier"] as const);
  return ordre.map((action) => gestion.trancherAvis(id, { action }, T, o).then((r) => ({ id, r })));
}));
let masques = 0;
for (const id of lot) {
  const siens = resultats.filter((x) => x.id === id).map((x) => x.r);
  const gagnants = siens.filter((r) => r.ok);
  egal(gagnants.length, 1, `avis ${id} : une seule décision passe`);
  const g = gagnants[0]!;
  assert.ok(g.ok);
  egal(siens.filter((r) => !r.ok), [{ ok: false, erreur: "deja-tranche", statut: g.statut }, { ok: false, erreur: "deja-tranche", statut: g.statut }]);
  egal(await statut(id), g.statut);
  egal(await signalements(id), 1, "une seule décision écrite");
  if (g.statut === "masque") masques++;
}
egal(rappelsLot, lot.length, "un rappel par avis");
egal([await points(AUTEUR), (await journal(AUTEUR)).length], [avantLot - 10 * masques, lignesAvantLot + masques], "−10 par avis masqué, jamais deux fois");

// L'écriture conditionnelle de la base : une décision concurrente glisse juste avant notre écriture (comme si le verrou
// manquait) ; la nôtre ne passe pas, sans points ni rappel
const a4 = await ecrireAvis(AUTEUR, { photo: "photo-4.jpg" });
const depotDouble: DepotAvis = {
  lire: depot.lire,
  ecrire: (fn) => depot.ecrire((t) => fn({
    ...t,
    async changerStatutAvis(avisId, de, vers) {
      await t.brut!.$executeRawUnsafe(`UPDATE avis SET statut = 'publie' WHERE id = $1`, avisId);
      return t.changerStatutAvis(avisId, de, vers);
    },
  })),
};
const pointsAvantA4 = await points(AUTEUR);
let rappelsA4 = 0;
egal(await creerAvisGestion({ depot: depotDouble }).trancherAvis(a4, { action: "masquer" }, T, { dansLaTransaction: async () => void rappelsA4++ }),
  { ok: false, erreur: "deja-tranche", statut: "publie" });
egal([await statut(a4), await points(AUTEUR), rappelsA4], ["publie", pointsAvantA4, 0]);

// ---------- (c) masquer puis rétablir un avis vérifié avec photo ----------
const a5 = await ecrireAvis(AUTEUR, { photo: "photo-5.jpg" });
const p0 = await points(AUTEUR);
egal((await gestion.trancherAvis(a5, { action: "masquer" }, T)).ok, true);
egal(await points(AUTEUR), p0 - 10);
// Le rendu rate (panne sur le journal) : l'avis reste masqué, rien n'est rendu
await panne("avis rétabli");
defisNotes.length = 0;
await rejette(gestion.retablirAvis(a5, T), /journal des points indisponible/);
egal([await statut(a5), await points(AUTEUR), defisNotes], ["masque", p0 - 10, []], "rendu refusé : toujours masqué, pas de défis");
await panne(null);
egal(await gestion.retablirAvis(a5, T), { ok: true, avisId: a5, compteId: AUTEUR, lieuId: LIEU, pointsRendus: 10, aReevaluer: true });
egal([await statut(a5), await points(AUTEUR), defisNotes], ["publie", p0, [AUTEUR]], "rétabli : les points reviennent avec lui, défis relancés après");
egal((await journal(AUTEUR)).filter(([, d]) => String(d).endsWith(` ${a5}, lieu ${LIEU}`)), [[10, `avis ${a5}, lieu ${LIEU}`], [-10, `avis masqué ${a5}, lieu ${LIEU}`], [10, `avis rétabli ${a5}, lieu ${LIEU}`]]);
egal(await gestion.retablirAvis(a5, T), { ok: false, erreur: "pas-masque" }, "jamais rendu deux fois");
egal(await points(AUTEUR), p0);

// Sans photo, repas offert, non vérifié : masqués puis rétablis sans un point
const sansPoints = [await ecrireAvis(AUTEUR), await ecrireAvis(AUTEUR, { photo: "photo-6.jpg", repasOffert: true }), await ecrireAvis(AUTEUR, { verifie: false, photo: "photo-7.jpg" })];
const lignesAvant = (await journal(AUTEUR)).length;
for (const id of sansPoints) {
  const m = await gestion.trancherAvis(id, { action: "masquer" }, T);
  const r = await gestion.retablirAvis(id, T);
  egal([m.ok && m.pointsRetires, r.ok && r.pointsRendus, await statut(id)], [0, 0, "publie"]);
}
egal([(await journal(AUTEUR)).length, await points(AUTEUR)], [lignesAvant, p0]);

// Le plancher à 0 : un compte à 3 points (d'autres retraits depuis l'écriture et ses +10) perd 3 (le journal le dit), puis
// les retrouve, pas un de plus
const a8 = await ecrireAvis(PAUVRE, { photo: "photo-8.jpg" });
await poserTotal(PAUVRE, 3);
egal(await gestion.trancherAvis(a8, { action: "masquer" }, T), { ok: true, avisId: a8, compteId: PAUVRE, lieuId: LIEU, statut: "masque", pointsRetires: 3 });
egal([await points(PAUVRE), await journal(PAUVRE)], [0, [[10, `avis ${a8}, lieu ${LIEU}`], [-3, `avis masqué ${a8}, lieu ${LIEU}`]]], "retrait réel : 3");
// À 0 point : rien à retirer, rien au journal, rien à rendre
const a8b = await ecrireAvis(PAUVRE, { photo: "photo-8b.jpg" });
await poserTotal(PAUVRE, 0);
egal(await gestion.trancherAvis(a8b, { action: "masquer" }, T), { ok: true, avisId: a8b, compteId: PAUVRE, lieuId: LIEU, statut: "masque", pointsRetires: 0 });
egal(await gestion.retablirAvis(a8, T), { ok: true, avisId: a8, compteId: PAUVRE, lieuId: LIEU, pointsRendus: 3, aReevaluer: true });
egal(await gestion.retablirAvis(a8b, T), { ok: true, avisId: a8b, compteId: PAUVRE, lieuId: LIEU, pointsRendus: 0, aReevaluer: true });
egal([await points(PAUVRE), (await journal(PAUVRE)).map(([p]) => p)], [3, [10, -3, 10, 3]], "plancher à 0 : le compte retrouve ses 3 points, pas 10");

// Avec la vraie réévaluation des défis (sa propre transaction, après) : pas d'interblocage, les points de la photo s'annulent
const avecDefis = creerAvisGestion({ depot, reevaluerDefis: creerDefis({ ajouterPointsDans, donnerBadge }).reevaluer });
const a9 = await ecrireAvis(AUTEUR, { photo: "photo-9.jpg" });
egal((await avecDefis.trancherAvis(a9, { action: "masquer" }, T)).ok, true);
egal((await avecDefis.retablirAvis(a9, T)).ok, true);
egal((await journal(AUTEUR)).filter(([, d]) => String(d).endsWith(` ${a9}, lieu ${LIEU}`)).map(([p]) => p), [10, -10, 10], "ses points de l'écriture, retirés puis rendus");

// ---------- (d) une réponse posée est « en-relecture » et visible ----------
const a10 = await ecrireAvis(AUTEUR, { statut: "publie", raisonRelecture: null });
const REPONSE = "Merci moussaillon, on t'attend pour la prochaine fournée !";
egal((await pro.repondre(GERANT, a10, REPONSE)).ok, true);
egal(await sql(`SELECT reponse_texte, reponse_statut, reponse_par_id FROM avis WHERE id = $1`, a10), [{ reponse_texte: REPONSE, reponse_statut: "en-relecture", reponse_par_id: GERANT }]);
const reponseVue = async (avisId: number) => {
  const publique = await client.lireAvisLieu(LIEU, null);
  const comptoir = await pro.lister(GERANT, LIEU, null);
  assert.ok(publique.ok && comptoir.ok);
  return [publique.avis.find((x: { id: number }) => x.id === avisId)?.reponseLieu?.texte ?? null, comptoir.avis.find((x: { id: number }) => x.id === avisId)?.reponseLieu?.texte ?? null];
};
egal(await reponseVue(a10), [REPONSE, REPONSE], "visible tout de suite, au public et au comptoir");
egal(await pro.repondre(GERANT, a10, "Une deuxième ?"), { ok: false, erreur: "reponse-deja-donnee" });
egal(await depot.ecrire((t) => t.poserReponse(a10, { texte: "Encore ?", le: T, parId: GERANT })), false, "une réponse par avis, arrêtée par la base");
// Deux décisions en même temps sur la réponse : une seule passe ; masquée, elle disparaît ; rétablie, elle revient
const rep = await Promise.all([gestion.trancherReponseAvis(a10, { action: "masquer" }, T), gestion.trancherReponseAvis(a10, { action: "masquer" }, T)]);
egal(rep.filter((r) => r.ok).length, 1);
egal(await reponseVue(a10), [null, null], "masquée : plus montrée nulle part");
egal([await statut(a10), (await journal(GERANT)).length], ["publie", 0], "l'avis ne bouge pas ; jamais de points pour une réponse");
egal(await gestion.retablirReponseAvis(a10, T), { ok: true, avisId: a10, compteId: GERANT, lieuId: LIEU, pointsRendus: 0, aReevaluer: false });
egal(await reponseVue(a10), [REPONSE, REPONSE]);

await terminerEssai(import.meta.url, essai, verifications.nombre);
