// Contrôleurs du logiciel de gestion pour tous les comptes : liste, fiche, déconnexion partout, export des données
// (demande d'accès RGPD), lien de nouveau mot de passe, suppression, et date de naissance (afficher, corriger).
// Journal : « compte n° X », jamais de prénom ni de date de naissance.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ChiffrementDonnees } from "../../services/chiffrement-donnees.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { lirePrenom } from "../comptes-champs.ts";
import { lireNomChiffre } from "../comptes-profil-champs.ts";
import { creerLienReinitialisation, creerLienVerification, type OutilsComptes } from "./controleurs-ambassadeurs.ts";
import { ChampInvalide, lireId, lireParametre } from "./lire-champs.ts";

const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });
/** Sans la clé des données des comptes, ni export ni date de naissance (rien ne plante) */
const sansChiffrement = (reponse: Response) => reponse.status(503).json({ ok: false, erreur: "chiffrement-indisponible" });

export function creerControleursComptesGestion(s: ServicesGestion, comptes?: OutilsComptes, chiffrement: ChiffrementDonnees | null = null) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    liste: async (requete: Request, reponse: Response) => {
      const role = lireParametre(requete.query.role, 12);
      const methode = lireParametre(requete.query.methode, 8);
      const lieu = lireParametre(requete.query.lieu, 8);
      reponse.json(await s.listerComptes({
        recherche: lireParametre(requete.query.recherche),
        role: role === "ambassadeur" || role === "sans-role" ? role : "",
        methode: methode === "mail" || methode === "google" || methode === "apple" ? methode : "",
        lieu: lieu === "app" || lieu === "site" ? lieu : "",
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
      await noter(reponse, "Date de naissance corrigée", `compte n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
    /** « Modifier » : le prénom et le nom en clair (journal : sans les valeurs) */
    identite: async (requete: Request, reponse: Response) => {
      if (!(await s.lireCompteGestion(id(requete)))) return introuvable(reponse);
      if (!chiffrement) return sansChiffrement(reponse);
      const identite = await s.lireIdentite(id(requete), chiffrement);
      if (!identite) return introuvable(reponse);
      await noter(reponse, "Prénom et nom affichés (correction)", `compte n° ${id(requete)}`);
      reponse.json(identite);
    },
    /** Correction sur demande de la personne : { prenom, nom } (nom vide ou null : effacé), mêmes règles que dans l'app */
    corrigerIdentite: async (requete: Request, reponse: Response) => {
      const fiche = await s.lireCompteGestion(id(requete));
      if (!fiche) return introuvable(reponse);
      if (!chiffrement) return sansChiffrement(reponse);
      const corps = typeof requete.body === "object" && requete.body !== null ? (requete.body as Record<string, unknown>) : {};
      try {
        const prenom = lirePrenom(corps, (fiche as { prenom?: string }).prenom);
        await s.corrigerIdentite(id(requete), { prenom, nomChiffre: lireNomChiffre(corps, chiffrement) });
      } catch (erreur) {
        if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
        throw erreur;
      }
      await noter(reponse, "Prénom et nom corrigés", `compte n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
    /** Renvoie le mail de confirmation de l'adresse (nouveau lien, 7 jours) ; 409 si l'adresse est déjà confirmée */
    verification: async (requete: Request, reponse: Response) => {
      if (!comptes?.preparerVerificationEmail) return reponse.status(503).json({ ok: false, erreur: "bientot-disponible" });
      const fiche = await s.lireCompteGestion(id(requete));
      if (!fiche) return introuvable(reponse);
      if ((fiche as { emailVerifieLe?: Date | null }).emailVerifieLe) return reponse.status(409).json({ ok: false, erreur: "deja-verifie" });
      const { jeton, expireLe } = await comptes.preparerVerificationEmail(id(requete));
      const envoi = await s.envoyerLienVerificationEmail(id(requete), creerLienVerification(jeton), expireLe);
      if (!envoi.ok) return reponse.status(502).json(envoi);
      await noter(reponse, "Mail de confirmation de l'adresse renvoyé", `compte n° ${id(requete)}`);
      reponse.json({ ok: true, expireLe });
    },
    supprimer: async (requete: Request, reponse: Response) => {
      if (!(await s.supprimerCompte(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Compte SOS Miam supprimé (app comprise)", `compte n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
  };
}
