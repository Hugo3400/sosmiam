// Contrôleurs des rattachements pro ↔ lieu (« Lieu vérifié ✓ ») : liste, valider, refuser, retirer, et la réponse
// envoyée par mail à la personne. Journal : numéros seulement.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireId, lireParametre, lireTexte } from "./lire-champs.ts";

const OBJETS = { valider: "C'est validé : ton lieu est vérifié ✓", refuser: "Ta demande de rattachement", retirer: "Ton accès à la fiche" } as const;

export function creerControleursRattachements(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);

  return {
    liste: async (requete: Request, reponse: Response) =>
      reponse.json(await s.listerRattachements({ statut: lireParametre(requete.query.statut, 12), role: lireParametre(requete.query.role, 20), lieuId: lireId(requete.query.lieu) })),
    /** { decision: valider | refuser | retirer, reponse?, envoyer? } */
    decider: async (requete: Request, reponse: Response) => {
      const corps = (requete.body ?? {}) as Record<string, unknown>;
      let decision: "valider" | "refuser" | "retirer";
      let texte: string | null;
      try {
        decision = lireChoix(corps, "decision", ["valider", "refuser", "retirer"] as const);
        texte = lireTexte(corps, "reponse", 1000);
      } catch (erreur) {
        if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
        throw erreur;
      }
      const id = lireId(requete.params.id) ?? 0;
      const resultat = await s.deciderRattachement(id, decision, texte);
      if (!resultat) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      let mail: "envoye" | "aucun" | "echec" = "aucun";
      if (corps.envoyer === true && texte) {
        const envoi = await s.envoyerCourrielEcrit({ compteId: resultat.compteId }, `${OBJETS[decision]} (${resultat.nomLieu})`.slice(0, 150), texte);
        mail = envoi.ok ? "envoye" : "echec";
      }
      await noter(reponse, `Rattachement pro ${resultat.statut}`, `rattachement n° ${id}, lieu n° ${resultat.lieuId}, compte n° ${resultat.compteId}`);
      reponse.json({ ok: true, statut: resultat.statut, mail });
    },
  };
}
