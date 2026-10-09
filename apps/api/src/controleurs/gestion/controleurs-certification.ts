// Contrôleurs du logiciel de gestion pour « Ambassadeur certifié » (docs/decisions.md) : candidatures, acceptation (avec
// un mail de bienvenue), refus, et retrait du titre. Journal : numéros seulement, jamais un prénom ni une structure.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { lireId, lireParametre } from "./lire-champs.ts";

const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

export function creerControleursCertification(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    candidatures: async (requete: Request, reponse: Response) => reponse.json(await s.listerCandidaturesCertification(lireParametre(requete.query.statut, 12))),
    certifies: async (_requete: Request, reponse: Response) => reponse.json(await s.listerCertifies()),
    accepter: async (requete: Request, reponse: Response) => {
      const resultat = await s.accepterCertification(id(requete));
      if (resultat.etat === "introuvable") return introuvable(reponse);
      if (resultat.etat === "pas-ambassadeur") return reponse.status(409).json({ ok: false, erreur: "pas-ambassadeur" });
      const bienvenue = await s.prevenirCertifie(resultat.compteId);
      await noter(reponse, "Ambassadeur certifié", `candidature n° ${id(requete)} (compte n° ${resultat.compteId})`);
      reponse.json({ ok: true, bienvenue });
    },
    refuser: async (requete: Request, reponse: Response) => {
      if (!(await s.refuserCertification(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Candidature certifié refusée", `candidature n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
    retirer: async (requete: Request, reponse: Response) => {
      if (!(await s.retirerCertification(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Titre d'ambassadeur certifié retiré", `compte n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
  };
}
