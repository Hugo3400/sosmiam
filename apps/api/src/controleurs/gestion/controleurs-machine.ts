import type { Request, Response } from "express";

import { PERIODES_COURBES } from "../../services/gestion/releve-machine.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";

const introuvable = (reponse: Response) => void reponse.status(404).json({ ok: false, erreur: "introuvable" });

export function creerControleursMachine(s: ServicesGestion) {
  return {
    machines: async (_requete: Request, reponse: Response) => {
      reponse.json(await s.lireMachines());
    },
    courbes: async (requete: Request, reponse: Response) => {
      const periode = PERIODES_COURBES.find((possible) => possible === requete.query.periode) ?? "24h";
      const courbes = await s.lireCourbesMachine(String(requete.params.id), periode);
      if (!courbes) return introuvable(reponse);
      reponse.json(courbes);
    },
    systeme: async (requete: Request, reponse: Response) => {
      const systeme = await s.lireSystemeMachine(String(requete.params.id));
      if (!systeme) return introuvable(reponse);
      reponse.json(systeme);
    },
    sourcesJournaux: async (_requete: Request, reponse: Response) => {
      reponse.json(await s.listerSourcesJournaux());
    },
    journal: async (requete: Request, reponse: Response) => {
      const journal = await s.lireJournalServeur(String(requete.params.source), requete.query.filtre === "problemes" ? "problemes" : "tout");
      if (!journal) return introuvable(reponse);
      reponse.json(journal);
    },
  };
}
