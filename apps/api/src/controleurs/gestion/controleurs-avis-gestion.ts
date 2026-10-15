// Contrôleurs de la relecture des avis dans le logiciel de gestion : la file (lecture seule), et la décision de l'équipe
// sur un avis ou sur la réponse d'un lieu (service de la session App, avis-gestion.ts ; absent → 503). Masquer demande la
// règle enfreinte et le pourquoi pour l'auteur ; le journal garde les numéros et le motif, jamais le texte de l'avis.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { AvisGestion } from "../../services/avis-gestion.ts";
import type { ModerationSociale } from "../../services/gestion/cibles-moderation.ts";
import { MOTIFS_MODERATION } from "../../services/gestion/motifs-moderation.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireId, lireTexte } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

export function creerControleursAvisGestion(s: ServicesGestion, avis?: AvisGestion, social?: ModerationSociale) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);

  /** POST /avis/:id/decision et /avis/:id/reponse/decision : { action: "publier" | "masquer", motif?, motivation? } */
  const decider = (cible: "avis" | "reponse-avis") => async (requete: Request, reponse: Response) => {
    if (!avis) return reponse.status(503).json({ ok: false, erreur: "indisponible" });
    const corps = corpsDe(requete);
    let decision: Parameters<ServicesGestion["deciderAvis"]>[3];
    try {
      const action = lireChoix(corps, "action", ["publier", "masquer"] as const);
      if (action === "publier") decision = { action };
      else {
        const motif = lireChoix(corps, "motif", MOTIFS_MODERATION);
        const motivation = lireTexte(corps, "motivation", 1000, true);
        if (motivation.trim().length < 10) throw new ChampInvalide("motivation");
        decision = { action, motif, motivation: motivation.trim() };
      }
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
    const id = lireId(requete.params.id);
    if (!id) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
    const resultat = await s.deciderAvis(avis, cible, id, decision, social);
    if (!resultat.ok) {
      if (resultat.erreur === "deja-tranche") return reponse.status(409).json({ ok: false, erreur: "deja-tranche", statut: resultat.statut });
      return reponse.status(404).json({ ok: false, erreur: "introuvable" });
    }
    const quoi = cible === "avis" ? "Avis" : "Réponse d'un lieu à un avis";
    const fait = decision.action === "publier" ? (cible === "avis" ? "publié" : "publiée") : (cible === "avis" ? "masqué" : "masquée");
    await noter(reponse, `${quoi} ${fait}`, `avis n° ${id}, lieu n° ${resultat.lieuId}${decision.action === "masquer" ? `, motif « ${decision.motif} »` : ""}`);
    reponse.json({ ok: true });
  };

  return {
    /** GET /avis/a-relire?quoi=avis|reponses&page= */
    aRelire: async (requete: Request, reponse: Response) => {
      reponse.json(await s.listerAvisARelire({
        quoi: requete.query.quoi === "reponses" ? "reponses" : "avis",
        page: Math.min(1000, Math.max(1, Math.floor(Number(requete.query.page)) || 1)),
      }));
    },
    deciderAvis: decider("avis"),
    deciderReponse: decider("reponse-avis"),
  };
}
