// Contrôleurs de la modération (logiciel de gestion) : la file des signalements, la décision avec sa règle et son
// explication pour l'auteur (règlement européen sur les services numériques, art. 17), la contestation et le réexamen.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import { MOTIFS_MODERATION } from "../../services/gestion/motifs-moderation.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireId, lireParametre, lireTexte } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

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

export function creerControleursModeration(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    signalements: verifier(async (requete, reponse) => reponse.json(await s.listerSignalements(lireParametre(requete.query.statut, 10)))),
    decider: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const decision = lireChoix(corps, "decision", ["retenu", "rejete"] as const);
      // Contenu retiré : la règle enfreinte et le pourquoi pour l'auteur sont obligatoires
      const motif = decision === "retenu" ? lireChoix(corps, "motif", MOTIFS_MODERATION) : null;
      const motivation = decision === "retenu" ? lireTexte(corps, "motivation", 1000, true) : lireTexte(corps, "motivation", 1000);
      if (decision === "retenu" && (motivation ?? "").trim().length < 10) throw new ChampInvalide("motivation");
      const resultat = await s.deciderSignalement(id(requete), { decision, note: lireTexte(corps, "note", 500), motif, motivation });
      if (!resultat) return introuvable(reponse);
      if (resultat === "deja-decide") return reponse.status(409).json({ ok: false, erreur: "deja-decide" });
      const action = decision === "retenu" ? "Signalement retenu (contenu retiré)" : "Signalement rejeté";
      await noter(reponse, resultat.reexamen ? `Réexamen : ${action.toLowerCase()}` : action, `${resultat.cible} n° ${resultat.cibleId}, ${resultat.regles} signalement(s) réglé(s)${motif ? `, motif « ${motif} »` : ""}`);
      reponse.json({ ok: true, ...resultat });
    }),
    contester: verifier(async (requete, reponse) => {
      const contestation = lireTexte(corpsDe(requete), "contestation", 1000, true);
      if (!(await s.contesterSignalement(id(requete), contestation))) return reponse.status(409).json({ ok: false, erreur: "pas-encore-decide" });
      await noter(reponse, "Décision de modération contestée (à réexaminer)", `signalement n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
  };
}
