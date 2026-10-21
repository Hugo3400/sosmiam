import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ActionServeur, ResultatPilotage } from "../../services/gestion/serveurs-dev.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

const STATUTS_REFUS: Record<Exclude<ResultatPilotage, { ok: true }>["erreur"], number> = {
  "serveur-inconnu": 404,
  "lecture-seule": 403,
  "action-inconnue": 400,
  "action-en-cours": 409,
  "deja-allume": 409,
  "deja-eteint": 409,
  "serveur-absent": 409,
  "pm2-introuvable": 503,
  "pm2-trop-long": 503,
  "pm2-erreur": 503,
};

const JOURNAL_REUSSITE: Record<ActionServeur, string> = {
  allumer: "Serveur de dev allumé",
  eteindre: "Serveur de dev éteint",
  redemarrer: "Serveur de dev redémarré",
};

const JOURNAL_ECHEC: Record<ActionServeur, string> = {
  allumer: "Serveur de dev : allumage raté",
  eteindre: "Serveur de dev : extinction ratée",
  redemarrer: "Serveur de dev : redémarrage raté",
};

export function creerControleursServeursDev(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);

  return {
    liste: async (_requete: Request, reponse: Response) => {
      reponse.json(await s.lireServeursDev());
    },
    agir: async (requete: Request, reponse: Response) => {
      const demande = corpsDe(requete).action;
      const resultat = await s.piloterServeurDev(String(requete.params.id), typeof demande === "string" ? demande : "");
      if (resultat.ok) {
        await noter(reponse, JOURNAL_REUSSITE[resultat.action], resultat.serveur.processus);
        return void reponse.json({ ok: true, serveur: resultat.etat });
      }
      if (resultat.erreur === "action-inconnue") return void reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "action" });
      if (resultat.erreur === "lecture-seule") {
        await noter(reponse, "Serveur : action refusée", `${resultat.serveur.processus} · ${String(demande).slice(0, 20)} (lecture seule)`);
      }
      if ("action" in resultat) {
        await noter(reponse, JOURNAL_ECHEC[resultat.action], `${resultat.serveur.processus} · ${resultat.erreur}${resultat.message ? ` · ${resultat.message}` : ""}`);
        return void reponse.status(STATUTS_REFUS[resultat.erreur]).json({ ok: false, erreur: resultat.erreur, ...(resultat.message ? { message: resultat.message } : {}) });
      }
      reponse.status(STATUTS_REFUS[resultat.erreur]).json({
        ok: false,
        erreur: resultat.erreur,
        ...(resultat.erreur === "action-en-cours" ? { enCours: resultat.enCours } : {}),
      });
    },
  };
}
