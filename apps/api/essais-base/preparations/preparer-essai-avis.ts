// La mise en place commune des deux essais des avis (avis-decisions.ts, avis-retablir.ts) : la base PGlite (avec
// pageinspect, pour lire un verrou dans l'en-tête d'une ligne), trois comptes et le Restaurant du Capitaine Bouiboui, les
// services des avis (le vrai dépôt creerDepotAvis, la gestion, le client et le comptoir) et les lectures de l'essai. Les
// services passent par le client global de l'API (connexion.ts), branché sur PGlite comme le client de l'essai.
//
// MUTANT_DEPOT / MUTANT_GESTION / MUTANT_CLIENT : le chemin absolu d'une copie modifiée de avis.ts / avis-gestion.ts /
// avis-client.ts, chargée à la place de l'original (l'essai doit alors échouer). Les mutants ne sont pas dans le dépôt.
//
// Limite : PGlite n'a qu'une session, et le pool d'essai ne fait passer qu'UNE transaction à la fois (pool-pglite.ts).
// Deux décisions « en même temps » s'y suivent donc toujours, et l'attente sur le verrou n'est pas rejouée : le verrou
// lui-même est lu dans l'en-tête de la ligne du compte (pageinspect), dans une transaction qui n'insère rien (une insertion
// au journal pose elle aussi un RowShareLock sur comptes, par sa clé étrangère) : xmax est CETTE transaction, en mode FOR
// UPDATE. L'écriture conditionnelle (le garde-fou si le verrou manquait) est vérifiée par une concurrente glissée juste
// avant elle.
import "../socle/garde-fou.ts";
import { pageinspect } from "@electric-sql/pglite/contrib/pageinspect";
import { calculerPointsPhotoAvis } from "../../src/fonctions/avis/calculer-points-photo-avis.ts";
import { construireDecisionAvis } from "../../src/fonctions/avis/construire-decision-avis.ts";
import { ecrireDetailPointsAvis } from "../../src/fonctions/avis/ecrire-detail-points-avis.ts";
import { creerAvisPro } from "../../src/services/avis-pro.ts";
import type { DepotAvis } from "../../src/services/avis-regles.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications } from "../socle/verifications.ts";

const original = (chemin: string) => new URL(chemin, import.meta.url).href;

export async function preparerEssaiAvis() {
  const essai = await creerBaseEnMemoire({ extensions: { pageinspect } });
  // Pour lire le verrou d'une ligne dans son en-tête (hors du schéma de l'API)
  await essai.db.exec("CREATE EXTENSION pageinspect");
  const { baseDeDonnees } = essai;
  const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
  const AUTEUR = await inserer("comptes", { email: "lea@exemple.fr", prenom: "Léa", points: 100, palier: "curieux" });
  const PAUVRE = await inserer("comptes", { email: "zoe@exemple.fr", prenom: "Zoé", points: 3, palier: "curieux" });
  const GERANT = await inserer("comptes", { email: "capitaine@exemple.fr", prenom: "Capitaine", points: 0, palier: "curieux" });
  const LIEU = await inserer("lieux", { nom: "Restaurant du Capitaine Bouiboui", type: "resto", emoji: "🍝", ville: "Montpellier", statut: "publie" });

  const { creerDepotAvis } = await import(process.env.MUTANT_DEPOT ?? original("../../src/services/avis.ts"));
  const { creerAvisGestion } = await import(process.env.MUTANT_GESTION ?? original("../../src/services/avis-gestion.ts"));
  const { creerAvisClient } = await import(process.env.MUTANT_CLIENT ?? original("../../src/services/avis-client.ts"));

  const verifications = creerVerifications();
  /** Lecture par Prisma (donc par la file du pool, jamais au milieu d'une transaction) */
  const sql = <T = Record<string, unknown>>(texte: string, ...p: unknown[]) => baseDeDonnees.$queryRawUnsafe<T[]>(texte, ...p);
  const T = new Date("2026-10-16T14:00:00Z");
  const depot: DepotAvis = creerDepotAvis();
  const defisNotes: number[] = [];
  const gestion = creerAvisGestion({ depot, reevaluerDefis: async (compteId: number) => void defisNotes.push(compteId) });
  const horloge = () => T.getTime();
  const client = creerAvisClient({ depot, chiffrement: null, tirer: () => 7, horloge });
  const pro = creerAvisPro({ depot, horloge }, async (compteId: number, lieuId: number) => (compteId === GERANT && lieuId === LIEU ? "gerant" : null));

  /**
   * Un avis du lieu, en relecture par défaut, écrit par le vrai dépôt ; verifie : grâce à une nouvelle visite validée. Ses
   * points dans la même transaction, comme avis-client.ts (pointsEcrits faux : un ancien avis, écrit avant le 15/10, dont
   * l'ajout d'après coup par ajouterPoints avait raté : il est resté sans eux)
   */
  async function ecrireAvis(compteId: number, champs: Record<string, unknown> & { verifie?: boolean; pointsEcrits?: boolean } = {}): Promise<number> {
    const { verifie = true, pointsEcrits = true, ...reste } = champs;
    const visiteId = verifie ? (await baseDeDonnees.visite.create({ data: { compteId, lieuId: LIEU, mode: "comptoir", statut: "validee", valideLe: T } as never })).id : null;
    return depot.ecrire(async (t) => {
      const avis = await t.creerAvis({
        compteId, lieuId: LIEU, visiteId, note: 4, texte: "Les crêpes du Capitaine, la Brigade valide.", photo: null, signature: "Léa M.",
        statut: "en-relecture", raisonRelecture: "tirage", repasOffert: false, creeLe: T, ...reste,
      } as never);
      const gagnes = calculerPointsPhotoAvis(avis);
      if (gagnes > 0 && pointsEcrits) await t.poserPointsPhoto(compteId, gagnes, ecrireDetailPointsAvis(avis));
      return avis.id;
    });
  }
  /** Le total d'un compte posé à la main (d'autres raisons l'ont fait bouger depuis l'écriture de ses avis) */
  const poserTotal = (compteId: number, total: number) => baseDeDonnees.$executeRawUnsafe(`UPDATE comptes SET points = $1 WHERE id = $2`, total, compteId);
  const statut = async (id: number) => (await sql<{ statut: string }>(`SELECT statut FROM avis WHERE id = $1`, id))[0]!.statut;
  const points = async (compteId: number) => (await sql<{ points: number }>(`SELECT points FROM comptes WHERE id = $1`, compteId))[0]!.points;
  /** Le journal des points « avis-photo » de ce compte, dans l'ordre */
  const journal = async (compteId: number) =>
    (await sql<{ points: number; detail: string }>(`SELECT points, detail FROM journal_points WHERE compte_id = $1 AND raison = 'avis-photo' ORDER BY id`, compteId)).map((l) => [l.points, l.detail]);
  /**
   * Le verrou de ligne posé sur ce compte, lu par tx dans l'en-tête de la ligne (pageinspect) : parMoi, xmax est la
   * transaction de tx ; forUpdate : verrou seul (HEAP_XMAX_LOCK_ONLY), exclusif (HEAP_XMAX_EXCL_LOCK) et sur la clé
   * (HEAP_KEYS_UPDATED), soit FOR UPDATE (FOR NO KEY UPDATE n'a pas le dernier, la clé étrangère d'une insertion pose FOR KEY
   * SHARE) ; tableRowShare : le RowShareLock que ce verrou laisse aussi sur la table
   */
  const lireVerrou = async (tx: any, compteId: number) => {
    const [l] = await tx.$queryRawUnsafe(`SELECT h.t_xmax::text = pg_current_xact_id_if_assigned()::text AS "parMoi",
        (h.t_infomask & 128) <> 0 AND (h.t_infomask & 64) <> 0 AND (h.t_infomask2 & 8192) <> 0 AS "forUpdate",
        EXISTS (SELECT 1 FROM pg_locks WHERE relation = 'comptes'::regclass AND pid = pg_backend_pid() AND mode = 'RowShareLock') AS "tableRowShare"
      FROM comptes c, heap_page_items(get_raw_page('comptes', (c.ctid::text::point)[0]::int)) h
      WHERE c.id = $1 AND h.lp = (c.ctid::text::point)[1]::int`, compteId) as { parMoi: boolean | null; forUpdate: boolean; tableRowShare: boolean }[];
    return { parMoi: l?.parMoi === true, forUpdate: l?.forUpdate === true, tableRowShare: l?.tableRowShare === true };
  };
  const signalements = async (avisId: number) =>
    (await sql<{ n: number }>(`SELECT count(*)::int AS n FROM signalements WHERE cible = 'avis' AND cible_id = $1`, String(avisId)))[0]!.n;
  const MOTIVATION = "Ton avis parlait d'un autre lieu.";
  /** Le rappel du logiciel : sa décision (une ligne Signalement retenue, construireDecisionAvis) écrite par la transaction prêtée */
  const ecrireDecision = async (tx: any, r: { avisId: number; lieuId: number; compteId: number | null }) => {
    await tx.signalement.create({ data: construireDecisionAvis({ cible: "avis", avisId: r.avisId, lieuId: r.lieuId, compteId: r.compteId, motif: "fausse-info", motivation: MOTIVATION, maintenant: T }) });
  };
  /** Une panne de la base sur le journal des points (déclencheur), pour les détails qui commencent ainsi */
  const panne = async (debut: string | null) => {
    await baseDeDonnees.$executeRawUnsafe(`DROP TRIGGER IF EXISTS essai_panne ON journal_points`);
    if (debut === null) return;
    await baseDeDonnees.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION essai_refuser_points() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'journal des points indisponible'; END $$ LANGUAGE plpgsql`);
    await baseDeDonnees.$executeRawUnsafe(`CREATE TRIGGER essai_panne BEFORE INSERT ON journal_points FOR EACH ROW WHEN (NEW.detail LIKE '${debut}%') EXECUTE FUNCTION essai_refuser_points()`);
  };

  return {
    essai, baseDeDonnees, verifications, egal: verifications.egal, rejette: verifications.rejette, sql, T, horloge, AUTEUR, PAUVRE, GERANT, LIEU,
    creerAvisGestion, creerAvisClient, depot, defisNotes, gestion, client, pro, ecrireAvis, poserTotal, statut, points, journal, lireVerrou,
    VERROU_PRIS: { parMoi: true, forUpdate: true, tableRowShare: true }, signalements, MOTIVATION, ecrireDecision, panne,
  };
}
