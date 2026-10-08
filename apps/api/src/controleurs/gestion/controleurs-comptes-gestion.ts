// Contrôleurs du logiciel de gestion pour tous les comptes : liste, fiche, déconnexion partout, export des données
// (demande d'accès RGPD), lien de nouveau mot de passe et suppression. Journal : « compte n° X », jamais de prénom.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { creerLienReinitialisation, type OutilsComptes } from "./controleurs-ambassadeurs.ts";
import { lireId, lireParametre } from "./lire-champs.ts";

const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

export function creerControleursComptesGestion(s: ServicesGestion, comptes?: OutilsComptes) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    liste: async (requete: Request, reponse: Response) => {
      const role = lireParametre(requete.query.role, 12);
      reponse.json(await s.listerComptes({
        recherche: lireParametre(requete.query.recherche),
        role: role === "ambassadeur" || role === "sans-role" ? role : "",
        page: Math.min(10_000, Math.max(1, Math.floor(Number(requete.query.page)) || 1)),
      }));
    },
    fiche: async (requete: Request, reponse: Response) => {
      const compte = await s.lireCompteGestion(id(requete));
      return compte ? reponse.json(compte) : introuvable(reponse);
    },
    deconnecter: async (requete: Request, reponse: Response) => {
      if (!(await s.lireCompteGestion(id(requete)))) return introuvable(reponse);
      const fermees = await s.deconnecterPartout(id(requete));
      await noter(reponse, "Compte déconnecté partout", `compte n° ${id(requete)}`);
      reponse.json({ ok: true, fermees });
    },
    exporter: async (requete: Request, reponse: Response) => {
      const donnees = await s.exporterDonneesCompte(id(requete));
      if (!donnees) return introuvable(reponse);
      await noter(reponse, "Données d'un compte exportées (demande d'accès)", `compte n° ${id(requete)}`);
      reponse.json(donnees);
    },
    reinitialiser: async (requete: Request, reponse: Response) => {
      if (!comptes) return reponse.status(503).json({ ok: false, erreur: "bientot-disponible" });
      if (!(await s.lireCompteGestion(id(requete)))) return introuvable(reponse);
      const envoyer = typeof requete.body === "object" && requete.body?.envoyer === true;
      const { jeton, expireLe } = await comptes.preparerReinitialisation(id(requete));
      const lien = creerLienReinitialisation(jeton);
      if (envoyer && (await s.envoyerLienMotDePasse(id(requete), lien, expireLe)).ok) {
        await noter(reponse, "Lien de nouveau mot de passe envoyé par mail", `compte n° ${id(requete)}`);
        return reponse.json({ ok: true, envoye: true, expireLe });
      }
      await noter(reponse, "Réinitialisation de mot de passe préparée", `compte n° ${id(requete)}`);
      reponse.json({ ok: true, envoye: false, lien, expireLe });
    },
    supprimer: async (requete: Request, reponse: Response) => {
      if (!(await s.supprimerCompte(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Compte SOS Miam supprimé (app comprise)", `compte n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
  };
}
