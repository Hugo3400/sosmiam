import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ActusGestion, DecisionActus } from "../../services/gestion/actus-gestion.ts";
import { MOTIFS_MODERATION } from "../../services/gestion/motifs-moderation.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import type { PhotosActus } from "../../services/photos-actus.ts";
import { ChampInvalide, lireChoix, lireId, lireTexte } from "./lire-champs.ts";

export type ActusDuLogiciel = { gestion: ActusGestion; photos: Pick<PhotosActus, "lireGestion"> };

const MOTIVATION_MIN = 10;

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

function lireMotivation(corps: Record<string, unknown>, champ: string): string {
  const texte = lireTexte(corps, champ, 1000, true).trim();
  if (texte.length < MOTIVATION_MIN) throw new ChampInvalide(champ);
  return texte;
}

export function creerControleursActusGestion(s: ServicesGestion, actus?: ActusDuLogiciel) {
  const noter = (reponse: Response, action: string, detail: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);

  const decider = (quoi: "article" | "reponse", faire: (a: ActusGestion, id: number, corps: Record<string, unknown>) => Promise<{ resultat: DecisionActus; journal: string }>) =>
    async (requete: Request, reponse: Response) => {
      if (!actus) return reponse.status(503).json({ ok: false, erreur: "indisponible" });
      const id = lireId(requete.params.id);
      if (!id) return reponse.status(404).json({ ok: false, erreur: quoi === "article" ? "article-introuvable" : "introuvable" });
      let fait: { resultat: DecisionActus; journal: string };
      try {
        fait = await faire(actus.gestion, id, corpsDe(requete));
      } catch (erreur) {
        if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
        throw erreur;
      }
      if (!fait.resultat.ok) {
        if (fait.resultat.erreur === "deja-decide") return reponse.status(409).json({ ok: false, erreur: "deja-decide" });
        return reponse.status(404).json({ ok: false, erreur: quoi === "article" ? "article-introuvable" : "introuvable" });
      }
      await noter(reponse, fait.journal, `${quoi === "article" ? "article" : "réponse"} n° ${id}`);
      reponse.json({ ok: true });
    };

  return {
    lister: async (_requete: Request, reponse: Response) => {
      if (!actus) return reponse.status(503).json({ ok: false, erreur: "indisponible" });
      reponse.set("Cache-Control", "no-store").json({ ok: true, ...(await actus.gestion.lister()) });
    },

    media: async (requete: Request, reponse: Response) => {
      const nom = String(requete.params.nom);
      const octets = actus ? await actus.photos.lireGestion(nom) : null;
      if (!octets) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      reponse.set("Cache-Control", "no-store").set("X-Content-Type-Options", "nosniff").type("image/jpeg").send(octets);
    },

    publier: decider("article", async (a, id, corps) => ({
      resultat: await a.publier(id, { aLaUne: corps.aLaUne === true, alcool: corps.alcool === true }),
      journal: corps.aLaUne === true ? "Article des Actus publié à la une" : "Article des Actus publié",
    })),

    retoucher: decider("article", async (a, id, corps) => ({ resultat: await a.retoucher(id, lireMotivation(corps, "message")), journal: "Article des Actus à retoucher" })),

    refuser: decider("article", async (a, id, corps) => {
      const motif = lireChoix(corps, "motif", MOTIFS_MODERATION);
      return { resultat: await a.refuser(id, motif, lireMotivation(corps, "motivation")), journal: `Article des Actus refusé, motif « ${motif} »` };
    }),

    publierReponse: decider("reponse", async (a, id) => ({ resultat: await a.publierReponse(id), journal: "Réponse d'un lieu à un article publiée" })),

    refuserReponse: decider("reponse", async (a, id, corps) => {
      const motif = lireChoix(corps, "motif", MOTIFS_MODERATION);
      return { resultat: await a.refuserReponse(id, motif, lireMotivation(corps, "motivation")), journal: `Réponse d'un lieu à un article refusée, motif « ${motif} »` };
    }),
  };
}
