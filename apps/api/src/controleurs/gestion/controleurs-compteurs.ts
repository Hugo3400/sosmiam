import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { AccesGestion } from "../../services/gestion/acces.ts";
import { creerJetonCompteurs, lireJetonCompteurs } from "../../services/gestion/jetons-compteurs.ts";

const INTERVALLE_MIN = 20_000;

type Dependances = {
  lireAcces: () => AccesGestion | null;
  lireAlertes: () => Promise<unknown>;
  noterAction: (poste: string, action: string, detail: string) => Promise<unknown>;
  horloge: () => number;
};

export function creerControleursCompteurs({ lireAcces, lireAlertes, noterAction, horloge }: Dependances) {
  const dernieresLectures = new Map<string, number>();

  return {
    creerJeton: async (_requete: Request, reponse: Response) => {
      const { poste } = reponse.locals.gestion as ContexteGestion;
      const acces = lireAcces();
      if (!acces) return reponse.status(503).json({ ok: false, erreur: "gestion-fermee" });
      if (poste.expireLe != null) return reponse.status(409).json({ ok: false, erreur: "poste-de-passage" });
      await noterAction(poste.nom, "Notifications avec le logiciel fermé activées", "");
      reponse.json({ ok: true, jeton: creerJetonCompteurs(acces.secretTotp, poste.id, horloge()) });
    },

    lire: async (requete: Request, reponse: Response) => {
      const acces = lireAcces();
      if (!acces) return reponse.status(503).json({ ok: false, erreur: "gestion-fermee" });
      const maintenant = horloge();
      const posteId = lireJetonCompteurs(acces.secretTotp, requete.get("x-gestion-jeton") ?? "", maintenant);
      const poste = posteId ? acces.postes.find((p) => p.id === posteId) : undefined;
      if (!poste || poste.expireLe != null) return reponse.status(401).json({ ok: false, erreur: "non-autorise" });
      const avant = dernieresLectures.get(poste.id);
      if (avant !== undefined && maintenant - avant < INTERVALLE_MIN) return reponse.status(429).json({ ok: false, erreur: "trop-tot" });
      dernieresLectures.set(poste.id, maintenant);
      reponse.json(await lireAlertes());
    },
  };
}
