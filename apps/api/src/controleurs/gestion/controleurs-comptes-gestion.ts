// Contrôleurs du logiciel de gestion pour tous les comptes : liste, fiche, déconnexion partout, export des données
// (demande d'accès RGPD), lien de nouveau mot de passe, suppression, et date de naissance (afficher, corriger).
// Journal : « compte n° X », jamais de prénom ni de date de naissance.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ChiffrementDonnees } from "../../services/chiffrement-donnees.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { creerLienReinitialisation, type OutilsComptes } from "./controleurs-ambassadeurs.ts";
import { lireId, lireParametre } from "./lire-champs.ts";

const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });
/** Sans la clé des données des comptes, ni export ni date de naissance (rien ne plante) */
const sansChiffrement = (reponse: Response) => reponse.status(503).json({ ok: false, erreur: "chiffrement-indisponible" });

export function creerControleursComptesGestion(s: ServicesGestion, comptes?: OutilsComptes, chiffrement: ChiffrementDonnees | null = null) {
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
      // D'abord le compte (404), puis la clé (503) : sans clé, rien d'autre ne casse
      if (!(await s.lireCompteGestion(id(requete)))) return introuvable(reponse);
      if (!chiffrement) return sansChiffrement(reponse);
      const donnees = await s.exporterDonneesCompte(id(requete), chiffrement);
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
    /** « Afficher » : la date de naissance en clair, et une ligne au journal (sans la date) */
    dateNaissance: async (requete: Request, reponse: Response) => {
      if (!(await s.lireCompteGestion(id(requete)))) return introuvable(reponse);
      if (!chiffrement) return sansChiffrement(reponse);
      const lue = await s.lireDateNaissance(id(requete), chiffrement);
      if (!lue) return introuvable(reponse);
      await noter(reponse, "Date de naissance affichée", `compte n° ${id(requete)}`);
      reponse.json(lue);
    },
    /** Correction sur demande de la personne : { date: "AAAA-MM-JJ" } */
    corrigerDateNaissance: async (requete: Request, reponse: Response) => {
      if (!(await s.lireCompteGestion(id(requete)))) return introuvable(reponse);
      if (!chiffrement) return sansChiffrement(reponse);
      const date = typeof requete.body === "object" && typeof requete.body?.date === "string" ? requete.body.date.trim() : "";
      const resultat = await s.corrigerDateNaissance(id(requete), date, chiffrement);
      if (resultat.etat === "introuvable") return introuvable(reponse);
      if (resultat.etat !== "corrigee") return reponse.status(400).json({ ok: false, erreur: resultat.etat });
      const roles = resultat.rolesRetires.length ? ` ; rôles retirés (moins de 18 ans) : ${resultat.rolesRetires.join(", ")}` : "";
      await noter(reponse, "Date de naissance corrigée", `compte n° ${id(requete)}${roles}`);
      reponse.json({ ok: true, rolesRetires: resultat.rolesRetires, majeur: resultat.age >= 18 });
    },
    supprimer: async (requete: Request, reponse: Response) => {
      if (!(await s.supprimerCompte(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Compte SOS Miam supprimé (app comprise)", `compte n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
  };
}
