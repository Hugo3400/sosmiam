// Proposer un nouveau lieu depuis n'importe quel compte (décidé le 9 octobre 2026, « Avant de brancher l'app », ouvert à
// tous les comptes le 14 octobre 2026) : depuis le 14 octobre, on ne s'inscrit plus avant 18 ans, l'âge a été vérifié à
// l'inscription, même quand la date n'est pas gardée (comptes du site). Le refus d'un âge connu sous 18 ans reste en
// filet de sécurité.
// Relu par l'équipe dans le logiciel de gestion, comme les propositions de l'espace ambassadeur (origine « compte »).
// La route du site pour les ambassadeurs (POST /comptes/moi/propositions) ne change pas.
import type { NextFunction, Request, Response } from "express";

import { AGE_ROLES } from "../fonctions/comptes/presenter-compte.ts";
import { estRobot, lireCompteId, lireCorps } from "./comptes-champs.ts";
import { lireChampsProposition } from "./comptes-espace.ts";
import { repondreChiffrementIndisponible, type ContexteComptes } from "./comptes.ts";

export function creerControleursPropositionsLieux({ services, lireCompteVu, chiffrement }: ContexteComptes) {
  return {
    /**
     * Après exigerCompte : 403 « reserve-aux-majeurs » si l'âge connu est sous 18 ans ; 503 « chiffrement-indisponible »
     * si la date gardée ne peut pas se lire. Sans date gardée (comptes du site), c'est oui.
     */
    async exigerMajeur(_requete: Request, reponse: Response, suite: NextFunction) {
      const compte = await lireCompteVu(lireCompteId(reponse));
      if (!compte) return reponse.status(401).json({ ok: false, erreur: "session-expiree" });
      if (compte.age !== null && compte.age < AGE_ROLES) return reponse.status(403).json({ ok: false, erreur: "reserve-aux-majeurs" });
      // Date gardée mais pas de clé pour la lire : ce n'est pas un refus, on réessaiera
      if (compte.age === null && !chiffrement && (await services.lireCompte(lireCompteId(reponse)))?.dateNaissanceChiffree) {
        return repondreChiffrementIndisponible(reponse);
      }
      suite();
    },

    /** GET /comptes/moi/propositions-lieux : ses propositions de lieux (toutes origines) et leur statut. */
    async lister(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, propositions: await services.listerPropositions(lireCompteId(reponse)) });
    },

    /** POST /comptes/moi/propositions-lieux : la pépite rejoint la file des demandes du logiciel de gestion. */
    async proposer(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      if (estRobot(corps)) return reponse.status(201).json({ ok: true });
      await services.creerProposition(lireCompteId(reponse), lireChampsProposition(corps), "compte");
      reponse.status(201).json({ ok: true });
    },
  };
}
