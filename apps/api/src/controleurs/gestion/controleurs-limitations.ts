// Contrôleurs de la limitation d'un compte dans le logiciel de gestion (décision de Hugo du 15 octobre 2026) : limiter avec
// la règle en cause et le pourquoi pour la personne, lever, réexaminer une contestation ; la personne est prévenue par la
// cloche (« compte-limite ») et par mail. Service de la session Site (limitations-comptes.ts ; absent → 503). Le journal
// garde les numéros, le motif et la fin, jamais le pourquoi ni la contestation.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ModerationSociale } from "../../services/gestion/cibles-moderation.ts";
import { MOTIFS_MODERATION } from "../../services/gestion/motifs-moderation.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import type { LimitationLue, ServicesLimitations } from "../../services/limitations-comptes-regles.ts";
import { ChampInvalide, lireChoix, lireId, lireTexte } from "./lire-champs.ts";

/** Durées proposées dans le logiciel, en jours (null : jusqu'à nouvel ordre) */
export const DUREES_LIMITATION = [1, 3, 7, 14, 30, 90, 365] as const;

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
const jour = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "sans fin");

function verifier(controleur: (requete: Request, reponse: Response) => Promise<unknown>) {
  return async (requete: Request, reponse: Response) => {
    try {
      await controleur(requete, reponse);
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
  };
}

export function creerControleursLimitations(s: ServicesGestion, limitations?: ServicesLimitations, social?: ModerationSociale) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const sansService = (reponse: Response) => reponse.status(503).json({ ok: false, erreur: "indisponible" });
  /** Le mot facultatif de l'équipe, recopié dans le mail (jamais au journal) */
  const lireMessage = (corps: Record<string, unknown>) => lireTexte(corps, "message", 1000)?.trim() || null;
  const prevenir = (quoi: Promise<unknown>) => quoi.catch((erreur: unknown) => console.error("Limitation : mail non mis en file :", (erreur as Error).message));

  return {
    /** GET /comptes/:id/limitations : celle en vigueur (en cours, sinon à venir) et tout l'historique */
    duCompte: async (requete: Request, reponse: Response) => {
      if (!limitations) return sansService(reponse);
      const id = lireId(requete.params.id);
      if (!id) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      const [enVigueur, toutes] = await Promise.all([limitations.lireLimitationDuCompte(id), limitations.listerLimitationsDuCompte(id)]);
      reponse.json({ enVigueur, toutes });
    },

    /** GET /limitations : celles qui courent (ou vont commencer) et les contestations à réexaminer */
    liste: async (_requete: Request, reponse: Response) => {
      if (!limitations) return sansService(reponse);
      const [enCours, contestations] = await Promise.all([s.listerLimitationsEnCours(), limitations.listerContestationsAReexaminer()]);
      reponse.json({ enCours, contestations });
    },

    /** POST /comptes/:id/limitations : { motif, motivation, jours: 1 | 3 | 7 | 14 | 30 | 90 | 365 | null } */
    limiter: verifier(async (requete, reponse) => {
      if (!limitations) return sansService(reponse);
      const corps = corpsDe(requete);
      const motif = lireChoix(corps, "motif", MOTIFS_MODERATION);
      const motivation = lireTexte(corps, "motivation", 1000, true);
      if (corps.jours !== null && !(DUREES_LIMITATION as readonly unknown[]).includes(corps.jours)) throw new ChampInvalide("jours");
      const compteId = lireId(requete.params.id);
      if (!compteId) return reponse.status(404).json({ ok: false, erreur: "compte-inconnu" });
      const maintenant = new Date();
      const fin = typeof corps.jours === "number" ? new Date(maintenant.getTime() + corps.jours * 86_400_000) : null;
      const resultat = await limitations.limiterCompte({ compteId, motif, motivation, fin }, maintenant);
      if (!resultat.ok) {
        if (resultat.erreur === "champ-invalide") return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: resultat.champ });
        if (resultat.erreur === "compte-inconnu") return reponse.status(404).json({ ok: false, erreur: "compte-inconnu" });
        if (resultat.erreur === "deja-limite") return reponse.status(409).json({ ok: false, erreur: "deja-limite" });
        return sansService(reponse);
      }
      const l = resultat.limitation;
      await noter(reponse, "Compte limité", `compte n° ${l.compteId}, limitation n° ${l.id}, motif « ${l.motif} », fin : ${jour(l.fin)}`);
      // La personne est prévenue dans l'app et par mail ; ni l'un ni l'autre ne bloque la décision, déjà enregistrée
      await social?.cloche
        .noter([{ compteId: l.compteId, type: "compte-limite", acteurId: null, cible: { type: "limitation", id: String(l.id) }, detail: l.motif }], maintenant)
        .catch((erreur: unknown) => console.error("Limitation : cloche non écrite :", (erreur as Error).message));
      await prevenir(s.prevenirCompteLimite(l, maintenant));
      reponse.json({ ok: true, limitation: l });
    }),

    /** POST /limitations/:id/levee : { message? } */
    lever: verifier(async (requete, reponse) => {
      if (!limitations) return sansService(reponse);
      const message = lireMessage(corpsDe(requete));
      const resultat = await limitations.leverLimitation(lireId(requete.params.id) ?? 0, new Date());
      if (!resultat.ok) return reponse.status(resultat.erreur === "introuvable" ? 404 : 409).json({ ok: false, erreur: resultat.erreur });
      const l: LimitationLue = resultat.limitation;
      await noter(reponse, "Limitation levée", `limitation n° ${l.id}, compte n° ${l.compteId}`);
      await prevenir(s.prevenirLimitationLevee(l, false, message));
      reponse.json({ ok: true, limitation: l });
    }),

    /** POST /limitations/:id/reexamen : { lever: boolean, message? } (la contestation a été relue) */
    reexaminer: verifier(async (requete, reponse) => {
      if (!limitations) return sansService(reponse);
      const corps = corpsDe(requete);
      if (typeof corps.lever !== "boolean") throw new ChampInvalide("lever");
      const message = lireMessage(corps);
      const resultat = await limitations.reexaminerLimitation(lireId(requete.params.id) ?? 0, new Date(), { lever: corps.lever });
      if (!resultat.ok) return reponse.status(resultat.erreur === "introuvable" ? 404 : 409).json({ ok: false, erreur: resultat.erreur });
      const l = resultat.limitation;
      await noter(reponse, `Réexamen de limitation : ${corps.lever ? "levée" : "maintenue"}`, `limitation n° ${l.id}, compte n° ${l.compteId}`);
      await prevenir(corps.lever ? s.prevenirLimitationLevee(l, true, message) : s.prevenirLimitationMaintenue(l, message));
      reponse.json({ ok: true, limitation: l });
    }),
  };
}
