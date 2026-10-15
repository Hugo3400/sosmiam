// Ce que l'équipe SOS Miam décide sur un avis ou sur la réponse d'un lieu, depuis le logiciel de gestion (docs/decisions.md,
// « Modération des avis et limitation d'un compte ») : publier ou masquer ce qui est en relecture, et remettre en ligne ce
// qu'un réexamen a rendu à son auteur. Ce service change le statut (écriture conditionnelle : deux décisions en même temps,
// une seule passe), puis, une fois la transaction validée, retire ou rend les points de la photo et relance les défis.
// Jamais de notification ni de cloche ici : la session du logiciel écrit sa décision (motif, motivation) dans la même
// transaction par dansLaTransaction, prévient l'auteur après, et appelle retablirAvis / retablirReponseAvis quand une
// contestation lui donne raison.
import type { StatutAvis, StatutReponseAvis } from "../../../../packages/commun/src/types/avis.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { calculerPointsPhotoAvis } from "../fonctions/avis/calculer-points-photo-avis.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import type { DepotAvis, LigneAvis, TablesAvis } from "./avis-regles.ts";

export type DecisionAvisGestion = { action: "publier" } | { action: "masquer" };

export type OptionsDecisionAvis = {
  /**
   * Appelé une fois, dans la transaction, juste après le changement de statut : tx est la transaction de la base (null dans
   * le double des tests) ; compteId : l'auteur de l'avis, ou celui de la réponse (null s'il a été effacé). S'il lève, rien
   * n'est écrit (statut compris) et l'erreur remonte.
   */
  dansLaTransaction?: (tx: Prisma.TransactionClient | null, r: { avisId: number; compteId: number | null; lieuId: number }) => Promise<void>;
};

/** pointsRetires : les points de la photo réellement retirés (0 s'il n'y en avait pas, ou si le retrait a raté : voir le journal) */
export type ResultatTrancherAvis =
  | { ok: true; avisId: number; compteId: number; lieuId: number; statut: "publie" | "masque"; pointsRetires: number }
  | { ok: false; erreur: "introuvable" }
  | { ok: false; erreur: "deja-tranche"; statut: StatutAvis };

/** compteId : le compte qui a écrit la réponse (null s'il a été effacé) */
export type ResultatTrancherReponse =
  | { ok: true; avisId: number; compteId: number | null; lieuId: number; statut: "publiee" | "masquee" }
  | { ok: false; erreur: "introuvable" }
  | { ok: false; erreur: "deja-tranche"; statut: StatutReponseAvis };

/** pointsRendus : les points de la photo réellement rendus (toujours 0 pour une réponse) */
export type ResultatRetablir =
  | { ok: true; avisId: number; compteId: number | null; lieuId: number; pointsRendus: number }
  | { ok: false; erreur: "introuvable" | "pas-masque" };

export type DependancesAvisGestion = {
  depot: DepotAvis;
  /** ajouterPoints de services/comptes.ts (négatif : retire ; le total ne descend jamais sous 0) */
  ajouterPoints: (compteId: number, points: number, raison: "avis-photo", detail?: string) => Promise<unknown>;
  /** reevaluer de services/defis.ts : un avis vérifié publié compte pour les défis (facultatif dans les tests) */
  reevaluerDefis?: (compteId: number, maintenant: Date) => Promise<unknown>;
};

const INTROUVABLE = { ok: false, erreur: "introuvable" } as const;

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

export function creerAvisGestion(d: DependancesAvisGestion) {
  /** Après la transaction : un raté est noté au journal, la décision reste écrite ; vrai si les points sont passés */
  async function poserPoints(compteId: number, points: number, detail: string): Promise<boolean> {
    try {
      await d.ajouterPoints(compteId, points, "avis-photo", detail);
      return true;
    } catch (erreur) {
      console.error("Avis : points de la photo non posés :", resumerErreur(erreur));
      return false;
    }
  }

  async function relancerDefis(compteId: number, maintenant: Date) {
    await d.reevaluerDefis?.(compteId, maintenant).catch((erreur: unknown) => console.error("Avis : défis non réévalués :", resumerErreur(erreur)));
  }

  return {
    /**
     * Publier ou masquer un avis en relecture. Masquer : il sort de la page du lieu, de sa moyenne et du comptoir ; les
     * points de sa photo sont retirés (avis vérifié avec photo, sauf repas offert). Publier un avis vérifié : il compte
     * désormais pour les défis.
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
        await o.dansLaTransaction?.(t.brut, { avisId, compteId: a.compteId, lieuId: a.lieuId });
        return { ok: true, avis: a } as const;
      });
      if (!r.ok) return r;
      const { compteId, lieuId, visiteId } = r.avis;
      let pointsRetires = 0;
      if (vers === "masque") {
        const points = calculerPointsPhotoAvis(r.avis);
        if (points > 0 && (await poserPoints(compteId, -points, `avis masqué ${avisId}, lieu ${lieuId}`))) pointsRetires = points;
      } else if (visiteId !== null) {
        await relancerDefis(compteId, maintenant);
      }
      return { ok: true, avisId, compteId, lieuId, statut: vers, pointsRetires };
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

    /** Un réexamen donne raison à l'auteur : l'avis masqué revient en ligne, avec les points de sa photo et les défis */
    async retablirAvis(avisId: number, maintenant: Date): Promise<ResultatRetablir> {
      const r = await d.depot.ecrire(async (t) => {
        const a = await relireSousVerrou(t, avisId);
        if (!a) return INTROUVABLE;
        if (a.statut !== "masque" || !(await t.changerStatutAvis(avisId, "masque", "publie"))) return { ok: false, erreur: "pas-masque" } as const;
        return { ok: true, avis: a } as const;
      });
      if (!r.ok) return r;
      const { compteId, lieuId, visiteId } = r.avis;
      const points = calculerPointsPhotoAvis(r.avis);
      const pointsRendus = points > 0 && (await poserPoints(compteId, points, `avis rétabli ${avisId}, lieu ${lieuId}`)) ? points : 0;
      if (visiteId !== null) await relancerDefis(compteId, maintenant);
      return { ok: true, avisId, compteId, lieuId, pointsRendus };
    },

    /** Un réexamen donne raison au lieu : sa réponse masquée revient en ligne (sans points) */
    async retablirReponseAvis(avisId: number, _maintenant: Date): Promise<ResultatRetablir> {
      return d.depot.ecrire(async (t) => {
        const a = await relireSousVerrou(t, avisId);
        if (!a || a.reponseTexte === null) return INTROUVABLE;
        if (a.reponseStatut !== "masquee" || !(await t.changerStatutReponse(avisId, "masquee", "publiee"))) return { ok: false, erreur: "pas-masque" } as const;
        return { ok: true, avisId, compteId: a.reponseParId, lieuId: a.lieuId, pointsRendus: 0 } as const;
      });
    },
  };
}

export type AvisGestion = ReturnType<typeof creerAvisGestion>;
