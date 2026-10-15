// Ce que l'équipe SOS Miam décide sur un avis ou sur la réponse d'un lieu, depuis le logiciel de gestion (docs/decisions.md,
// « Modération des avis et limitation d'un compte ») : publier ou masquer ce qui est en relecture, et remettre en ligne ce
// qu'un réexamen a rendu à son auteur. Une décision tient en UNE transaction, sous le verrou du compte de l'auteur : le
// statut change (écriture conditionnelle : deux décisions en même temps, une seule passe) et, avec lui, les points de la
// photo partent (masquer) ou reviennent (rétablir) : si l'un rate, ou si l'API s'arrête en route, rien n'est écrit. Les
// points se lisent dans le journal (raison « avis-photo ») : le masquage retire ceux de la règle (10), jamais plus que le
// total du compte (il ne descend jamais sous 0) ni que ce que CET avis tient encore (la ligne « avis <id>, lieu <lieuId> »
// posée avec l'avis, dans sa transaction, par avis-client.ts, plus ses masquages et ses retours en ligne : un avis écrit
// avant le 15/10, dont l'ajout d'après coup a raté, ne retire rien), et le journal note ce retrait réel ; le retour en ligne
// rend ce que le journal dit retiré pour CET avis, moins ce qui a déjà été rendu (jamais un point de plus). Seuls les défis
// sont relancés après (leur réévaluation ouvre sa propre transaction ; un raté y est seulement noté au journal). Jamais de
// notification ni de cloche ici : la session du logiciel écrit sa décision (motif, motivation) dans la même transaction par
// dansLaTransaction, prévient l'auteur après ; quand une contestation lui donne raison, elle appelle retablirAvisDans /
// retablirReponseAvisDans dans la transaction de son réexamen, puis apresRetablir une fois cette transaction validée.
import type { StatutAvis, StatutReponseAvis } from "../../../../packages/commun/src/types/avis.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { calculerPointsPhotoAvis } from "../fonctions/avis/calculer-points-photo-avis.ts";
import { ecrireDetailPointsAvis } from "../fonctions/avis/ecrire-detail-points-avis.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import type { DepotAvis, LigneAvis, TablesAvis } from "./avis-regles.ts";

export type DecisionAvisGestion = { action: "publier" } | { action: "masquer" };

export type OptionsDecisionAvis = {
  /**
   * Appelé une fois, dans la transaction, juste après le changement de statut et les points de la photo : tx est la
   * transaction de la base (null dans le double des tests) ; compteId : l'auteur de l'avis, ou celui de la réponse (null
   * s'il a été effacé). S'il lève, rien n'est écrit (statut et points compris) et l'erreur remonte.
   */
  dansLaTransaction?: (tx: Prisma.TransactionClient | null, r: { avisId: number; compteId: number | null; lieuId: number }) => Promise<void>;
};

/** pointsRetires : les points de la photo retirés dans la transaction du masquage (0 s'il n'y en avait pas) */
export type ResultatTrancherAvis =
  | { ok: true; avisId: number; compteId: number; lieuId: number; statut: "publie" | "masque"; pointsRetires: number }
  | { ok: false; erreur: "introuvable" }
  | { ok: false; erreur: "deja-tranche"; statut: StatutAvis };

/** compteId : le compte qui a écrit la réponse (null s'il a été effacé) */
export type ResultatTrancherReponse =
  | { ok: true; avisId: number; compteId: number | null; lieuId: number; statut: "publiee" | "masquee" }
  | { ok: false; erreur: "introuvable" }
  | { ok: false; erreur: "deja-tranche"; statut: StatutReponseAvis };

/**
 * pointsRendus : les points de la photo rendus dans la transaction du retour en ligne (toujours 0 pour une réponse) ;
 * aReevaluer : les défis de compteId sont à réévaluer une fois la transaction validée (un avis vérifié revenu en ligne) :
 * apresRetablir s'en charge (retablirAvis l'a déjà fait)
 */
export type ResultatRetablir =
  | { ok: true; avisId: number; compteId: number | null; lieuId: number; pointsRendus: number; aReevaluer: boolean }
  | { ok: false; erreur: "introuvable" | "pas-masque" };

export type DependancesAvisGestion = {
  depot: DepotAvis;
  /**
   * Inutilisé : les points de la photo bougent dans la transaction de la décision (TablesAvis.poserPointsPhoto), plus
   * jamais après. Accepté (et ignoré) pour ne pas casser un branchement qui le passe encore.
   */
  ajouterPoints?: (compteId: number, points: number, raison: "avis-photo", detail?: string) => Promise<unknown>;
  /** reevaluer de services/defis.ts : un avis vérifié publié compte pour les défis (facultatif dans les tests) */
  reevaluerDefis?: (compteId: number, maintenant: Date) => Promise<unknown>;
};

const INTROUVABLE = { ok: false, erreur: "introuvable" } as const;
const PAS_MASQUE = { ok: false, erreur: "pas-masque" } as const;

/**
 * Le détail des lignes du journal des points (raison « avis-photo ») : il relie chaque mouvement à son avis.
 * detailEcrit : celui que pose avis-client.ts avec l'avis (le même format depuis la création des avis, le 09/10)
 */
const detailEcrit = (a: LigneAvis) => ecrireDetailPointsAvis(a);
const detailMasque = (a: LigneAvis) => ecrireDetailPointsAvis(a, "masque");
const detailRetabli = (a: LigneAvis) => ecrireDetailPointsAvis(a, "retabli");

/**
 * Lit l'avis, verrouille le compte de son auteur (règle des appelants d'avis-regles.ts) et le relit sous le verrou ; null
 * s'il n'existe pas (ou plus)
 */
async function relireSousVerrou(t: TablesAvis, avisId: number): Promise<LigneAvis | null> {
  const avant = await t.lireAvis(avisId);
  if (!avant) return null;
  await t.verrouillerCompte(avant.compteId);
  return t.lireAvis(avisId);
}

/**
 * Ce que CET avis tient encore d'après le journal, sous le verrou : ses points de l'écriture, moins ce que ses masquages ont
 * retiré, plus ce que ses retours en ligne ont rendu
 */
async function lirePointsTenus(t: TablesAvis, a: LigneAvis): Promise<number> {
  let tenus = 0;
  for (const detail of [detailEcrit(a), detailMasque(a), detailRetabli(a)]) tenus += await t.sommerPointsPhoto(a.compteId, detail);
  return tenus;
}

/**
 * Masquage, sous le verrou : retire les points de la photo (la règle, 10 : jamais plus, même si le journal en dit davantage
 * pour cet avis), sans dépasser ni le total du compte (le plancher à 0 d'ajouterPointsDans ne mange alors rien, et le
 * journal dit le vrai retrait) ni ce que l'avis tient encore (jamais deux retraits pour un seul gain, rien pour un ancien
 * avis dont l'ajout a raté) ; rend ce qui a été retiré
 */
async function retirerPointsPhoto(t: TablesAvis, a: LigneAvis): Promise<number> {
  const prevus = calculerPointsPhotoAvis(a);
  if (prevus === 0) return 0;
  const retrait = Math.min(prevus, await t.lirePointsCompte(a.compteId), await lirePointsTenus(t, a));
  if (retrait <= 0) return 0;
  await t.poserPointsPhoto(a.compteId, -retrait, detailMasque(a));
  return retrait;
}

/**
 * Retour en ligne, sous le verrou : rend ce que le journal dit retiré au masquage de CET avis, moins ce qui a déjà été
 * rendu (un deuxième retour en ligne ne rend rien) ; rend ce qui a été rendu
 */
async function rendrePointsPhoto(t: TablesAvis, a: LigneAvis): Promise<number> {
  const retires = -(await t.sommerPointsPhoto(a.compteId, detailMasque(a)));
  if (retires <= 0) return 0;
  const aRendre = retires - (await t.sommerPointsPhoto(a.compteId, detailRetabli(a)));
  if (aRendre <= 0) return 0;
  await t.poserPointsPhoto(a.compteId, aRendre, detailRetabli(a));
  return aRendre;
}

/** Un avis masqué revient en ligne, avec ses points, dans la transaction de t ; « introuvable » et « pas-masque » rendus */
async function retablirAvisTables(t: TablesAvis, avisId: number): Promise<ResultatRetablir> {
  const a = await relireSousVerrou(t, avisId);
  if (!a) return INTROUVABLE;
  if (a.statut !== "masque" || !(await t.changerStatutAvis(avisId, "masque", "publie"))) return PAS_MASQUE;
  const pointsRendus = await rendrePointsPhoto(t, a);
  return { ok: true, avisId, compteId: a.compteId, lieuId: a.lieuId, pointsRendus, aReevaluer: a.visiteId !== null };
}

/** Une réponse masquée revient en ligne (sans points), dans la transaction de t */
async function retablirReponseTables(t: TablesAvis, avisId: number): Promise<ResultatRetablir> {
  const a = await relireSousVerrou(t, avisId);
  if (!a || a.reponseTexte === null) return INTROUVABLE;
  if (a.reponseStatut !== "masquee" || !(await t.changerStatutReponse(avisId, "masquee", "publiee"))) return PAS_MASQUE;
  return { ok: true, avisId, compteId: a.reponseParId, lieuId: a.lieuId, pointsRendus: 0, aReevaluer: false };
}

export function creerAvisGestion(d: DependancesAvisGestion) {
  /** Après la transaction : un raté est noté au journal, la décision (statut et points) reste écrite */
  async function relancerDefis(compteId: number, maintenant: Date) {
    await d.reevaluerDefis?.(compteId, maintenant).catch((erreur: unknown) => console.error("Avis : défis non réévalués :", resumerErreur(erreur)));
  }
  /** Après la transaction d'un retour en ligne : les défis, s'il y a lieu (ne lève jamais) */
  async function apresRetablir(r: ResultatRetablir, maintenant: Date): Promise<void> {
    if (r.ok && r.aReevaluer && r.compteId !== null) await relancerDefis(r.compteId, maintenant);
  }

  return {
    /**
     * Publier ou masquer un avis en relecture. Masquer : il sort de la page du lieu, de sa moyenne et du comptoir ; les
     * points de sa photo sont retirés avec lui (avis vérifié avec photo, sauf repas offert ; jamais plus que le total du
     * compte, ni que ce que l'avis tient encore d'après le journal). Publier un avis vérifié : il compte désormais pour les
     * défis (en relecture, il ne comptait pas : masqué, rien à relancer).
     */
    async trancherAvis(avisId: number, decision: DecisionAvisGestion, maintenant: Date, o: OptionsDecisionAvis = {}): Promise<ResultatTrancherAvis> {
      const vers = decision.action === "publier" ? "publie" : "masque";
      const r = await d.depot.ecrire(async (t) => {
        const a = await relireSousVerrou(t, avisId);
        if (!a) return INTROUVABLE;
        if (a.statut !== "en-relecture") return { ok: false, erreur: "deja-tranche", statut: a.statut } as const;
        if (!(await t.changerStatutAvis(avisId, "en-relecture", vers))) {
          const relu = await t.lireAvis(avisId);
          return relu ? ({ ok: false, erreur: "deja-tranche", statut: relu.statut } as const) : INTROUVABLE;
        }
        const pointsRetires = vers === "masque" ? await retirerPointsPhoto(t, a) : 0;
        await o.dansLaTransaction?.(t.brut, { avisId, compteId: a.compteId, lieuId: a.lieuId });
        return { ok: true, avis: a, pointsRetires } as const;
      });
      if (!r.ok) return r;
      const { compteId, lieuId, visiteId } = r.avis;
      if (vers === "publie" && visiteId !== null) await relancerDefis(compteId, maintenant);
      return { ok: true, avisId, compteId, lieuId, statut: vers, pointsRetires: r.pointsRetires };
    },

    /** Publier ou masquer la réponse d'un lieu en relecture (masquée : plus montrée nulle part, et jamais remplacée) */
    async trancherReponseAvis(avisId: number, decision: DecisionAvisGestion, _maintenant: Date, o: OptionsDecisionAvis = {}): Promise<ResultatTrancherReponse> {
      const vers = decision.action === "publier" ? "publiee" : "masquee";
      return d.depot.ecrire(async (t) => {
        const a = await relireSousVerrou(t, avisId);
        if (!a || a.reponseTexte === null) return INTROUVABLE;
        if (a.reponseStatut !== "en-relecture") return { ok: false, erreur: "deja-tranche", statut: a.reponseStatut ?? "publiee" } as const;
        if (!(await t.changerStatutReponse(avisId, "en-relecture", vers))) {
          const relu = await t.lireAvis(avisId);
          return relu && relu.reponseTexte !== null ? ({ ok: false, erreur: "deja-tranche", statut: relu.reponseStatut ?? "publiee" } as const) : INTROUVABLE;
        }
        await o.dansLaTransaction?.(t.brut, { avisId, compteId: a.reponseParId, lieuId: a.lieuId });
        return { ok: true, avisId, compteId: a.reponseParId, lieuId: a.lieuId, statut: vers } as const;
      });
    },

    /**
     * Un réexamen donne raison à l'auteur, DANS la transaction de l'appelant (tx : celle de son réexamen) : verrou du compte,
     * relecture, masqué → publié (écriture conditionnelle) et, avec lui, les points retirés au masquage. « introuvable » et
     * « pas-masque » sont rendus (rien n'a été écrit, la transaction reste utilisable) ; une erreur de la base, ou de
     * depot.dans, rejette la promesse, jamais pendant l'appel (la transaction de l'appelant revient alors en arrière). Les
     * défis : apresRetablir, une fois tx validée.
     */
    async retablirAvisDans(tx: Prisma.TransactionClient, avisId: number, _maintenant: Date): Promise<ResultatRetablir> {
      return retablirAvisTables(d.depot.dans(tx), avisId);
    },

    /** Le pendant de retablirAvisDans pour la réponse d'un lieu : masquée → publiée, sans points ni défis */
    async retablirReponseAvisDans(tx: Prisma.TransactionClient, avisId: number, _maintenant: Date): Promise<ResultatRetablir> {
      return retablirReponseTables(d.depot.dans(tx), avisId);
    },

    /** Après la validation de la transaction de retablirAvisDans (ou de la réponse) : relance les défis ; ne lève jamais */
    apresRetablir,

    /** retablirAvisDans dans sa propre transaction, puis apresRetablir */
    async retablirAvis(avisId: number, maintenant: Date): Promise<ResultatRetablir> {
      const r = await d.depot.ecrire((t) => retablirAvisTables(t, avisId));
      await apresRetablir(r, maintenant);
      return r;
    },

    /** retablirReponseAvisDans dans sa propre transaction (rien à relancer après) */
    async retablirReponseAvis(avisId: number, maintenant: Date): Promise<ResultatRetablir> {
      const r = await d.depot.ecrire((t) => retablirReponseTables(t, avisId));
      await apresRetablir(r, maintenant);
      return r;
    },
  };
}

export type AvisGestion = ReturnType<typeof creerAvisGestion>;
