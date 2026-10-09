// Proposer un nouveau lieu depuis n'importe quel compte de 18 ans et plus (décidé le 9 octobre 2026, « Avant de brancher
// l'app ») : âge connu d'au moins 18 ans, ou ambassadeur actif, ou pro validé (ces deux rôles prouvent déjà 18 ans).
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
     * Après exigerCompte : 403 « reserve-aux-majeurs » si l'âge n'est pas connu d'au moins 18 ans et que le compte n'est
     * ni ambassadeur actif ni pro validé ; 503 « chiffrement-indisponible » si la date gardée ne peut pas se lire.
     */
    async exigerMajeur(_requete: Request, reponse: Response, suite: NextFunction) {
      const compte = await lireCompteVu(lireCompteId(reponse));
      if (!compte) return reponse.status(401).json({ ok: false, erreur: "session-expiree" });
      const majeur = (compte.age !== null && compte.age >= AGE_ROLES) || compte.ambassadeur?.statut === "actif" || compte.pro.lieuxValides.length > 0;
      if (majeur) return suite();
      // Date gardée mais pas de clé pour la lire : ce n'est pas un refus, on réessaiera
      if (compte.age === null && !chiffrement && (await services.lireCompte(lireCompteId(reponse)))?.dateNaissanceChiffree) {
        return repondreChiffrementIndisponible(reponse);
      }
      reponse.status(403).json({ ok: false, erreur: "reserve-aux-majeurs" });
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
