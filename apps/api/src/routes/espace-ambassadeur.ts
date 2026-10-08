import { Router, type Request, type Response } from "express";

import { lireId } from "../controleurs/gestion/lire-champs.ts";
import type { marquerMessageLu, messagesDuCompte, missionsDuCompte, terminerMission } from "../services/gestion/missions-messages.ts";

export type DependancesEspaceAmbassadeur = {
  missionsDuCompte: typeof missionsDuCompte;
  terminerMission: typeof terminerMission;
  messagesDuCompte: typeof messagesDuCompte;
  marquerMessageLu: typeof marquerMessageLu;
};

/**
 * /espace-ambassadeur/… : « Mes missions » et « Mes messages » de l'espace ambassadeur. Sans protection ici : le routeur est
 * monté derrière exigerAmbassadeurActif (middlewares/proteger-comptes.ts), qui met le compte dans reponse.locals.compte.
 */
export function creerRoutesEspaceAmbassadeur(d: DependancesEspaceAmbassadeur) {
  const routes = Router();
  const compteId = (reponse: Response) => (reponse.locals.compte as { id: number }).id;

  routes.get("/missions", async (_requete: Request, reponse: Response) => {
    reponse.json({ ok: true, missions: await d.missionsDuCompte(compteId(reponse)) });
  });
  routes.post("/missions/:id/compte-rendu", async (requete: Request, reponse: Response) => {
    const id = lireId(requete.params.id);
    const compteRendu = typeof requete.body?.compteRendu === "string" ? requete.body.compteRendu.trim().slice(0, 2000) : "";
    if (!id || compteRendu.length < 5) return reponse.status(400).json({ ok: false, erreur: "compte-rendu-trop-court" });
    if (!(await d.terminerMission(compteId(reponse), id, compteRendu))) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
    reponse.json({ ok: true });
  });
  routes.get("/messages", async (_requete: Request, reponse: Response) => {
    reponse.json({ ok: true, messages: await d.messagesDuCompte(compteId(reponse)) });
  });
  routes.post("/messages/:id/lu", async (requete: Request, reponse: Response) => {
    const id = lireId(requete.params.id);
    if (!id || !(await d.marquerMessageLu(compteId(reponse), id))) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
    reponse.json({ ok: true });
  });
  return routes;
}
