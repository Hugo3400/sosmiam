// Contrôleurs du logiciel de gestion pour les ambassadeurs : comptes, décisions, points, missions et messages
// (candidatures fondateur : controleurs-fondateurs.ts). Les règles des points et des badges restent dans services/comptes.ts (passées en `comptes`).
// Journal : seulement des numéros (« compte n° X »), jamais un prénom ni une adresse (il n'est jamais effacé).
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireId, lireNombre, lireParametre, lireTexte } from "./lire-champs.ts";

/** Ce que services/comptes.ts (session du site) fournit : une seule source pour les points, badges et réinitialisations */
export type OutilsComptes = {
  ajouterPoints: (compteId: number, points: number, raison: "equipe" | "proposer-lieu", detail?: string) => Promise<{ points: number; palier: string }>;
  donnerBadge: (compteId: number, badge: string) => Promise<boolean>;
  preparerReinitialisation: (compteId: number) => Promise<{ jeton: string; expireLe: Date }>;
  nommerAmbassadeurVille: (compteId: number) => Promise<void>;
  retirerAmbassadeurVille: (compteId: number) => Promise<string>;
};

/** Adresse écrite en dur (jamais tirée d'un en-tête de la demande) */
const ESPACE_AMBASSADEUR = "https://ambassadeur.sosmiam.fr";
/** Lien pour choisir un nouveau mot de passe : le jeton après « # » reste dans le navigateur, jamais dans les journaux */
export const creerLienReinitialisation = (jeton: string) => `${ESPACE_AMBASSADEUR}/nouveau-mot-de-passe#jeton=${encodeURIComponent(jeton)}`;
const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });
const indisponible = (reponse: Response) => reponse.status(503).json({ ok: false, erreur: "bientot-disponible" });

function verifier(controleur: (requete: Request, reponse: Response) => Promise<unknown>) {
  return async (requete: Request, reponse: Response) => {
    try {
      await controleur(requete, reponse);
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
  };
}

export function creerControleursAmbassadeurs(s: ServicesGestion, comptes?: OutilsComptes) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    liste: verifier(async (requete, reponse) =>
      reponse.json(await s.listerAmbassadeurs({
        statut: lireParametre(requete.query.statut, 12),
        palier: lireParametre(requete.query.palier, 24),
        recherche: lireParametre(requete.query.recherche),
        ville: lireParametre(requete.query.ville, 80),
      })),
    ),
    fiche: verifier(async (requete, reponse) => {
      const ambassadeur = await s.lireAmbassadeur(id(requete));
      return ambassadeur ? reponse.json(ambassadeur) : introuvable(reponse);
    }),
    decider: verifier(async (requete, reponse) => {
      const statut = lireChoix(corpsDe(requete), "statut", ["actif", "refuse", "suspendu"] as const);
      const resultat = await s.deciderAmbassadeur(id(requete), statut);
      if (!resultat) return introuvable(reponse);
      const actions = { actif: resultat.avant === "en-attente" ? "Ambassadeur validé" : "Ambassadeur réactivé", refuse: "Ambassadeur refusé", suspendu: "Ambassadeur suspendu" };
      await noter(reponse, actions[statut], `compte n° ${id(requete)}`);
      // Inscription validée : le mail de bienvenue part tout seul (file d'attente ; la décision ne dépend pas de lui)
      const bienvenue = statut === "actif" && resultat.avant === "en-attente"
        ? await s.prevenirAmbassadeurValide(id(requete)).catch(() => false)
        : false;
      reponse.json({ ok: true, bienvenue });
    }),
    modifier: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const modification = {
        ...(corps.ville !== undefined ? { ville: lireTexte(corps, "ville", 80, true) } : {}),
        ...(corps.quartier !== undefined ? { quartier: lireTexte(corps, "quartier", 80) } : {}),
        ...(corps.noteEquipe !== undefined ? { noteEquipe: lireTexte(corps, "noteEquipe", 2000) } : {}),
      };
      if (!(await s.modifierAmbassadeur(id(requete), modification))) return introuvable(reponse);
      await noter(reponse, "Fiche d'ambassadeur modifiée", `compte n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
    points: verifier(async (requete, reponse) => {
      if (!comptes) return indisponible(reponse);
      const corps = corpsDe(requete);
      const points = lireNombre(corps, "points", -10_000, 10_000);
      if (!points) throw new ChampInvalide("points");
      const detail = lireTexte(corps, "detail", 200, true);
      const resultat = await comptes.ajouterPoints(id(requete), points, "equipe", detail);
      await noter(reponse, points > 0 ? "Points ajoutés" : "Points retirés", `${points > 0 ? "+" : ""}${points} au compte n° ${id(requete)} : ${detail}`);
      reponse.json({ ok: true, ...resultat });
    }),
    palierVille: verifier(async (requete, reponse) => {
      if (!comptes) return indisponible(reponse);
      const ville = corpsDe(requete).ville === true;
      const prenom = await s.lirePrenom(id(requete));
      if (!prenom) return introuvable(reponse);
      // Réservé aux fondateurs en place d'une ville, pas d'un département (décidé par Hugo le 9 octobre 2026)
      if (ville && !(await s.estFondateurDeVille(id(requete)))) return reponse.status(409).json({ ok: false, erreur: "pas-fondateur-de-ville" });
      let palier = "ambassadeur-ville";
      if (ville) await comptes.nommerAmbassadeurVille(id(requete));
      else palier = await comptes.retirerAmbassadeurVille(id(requete));
      await noter(reponse, ville ? "Nommé ambassadeur de ville" : "Rôle d'ambassadeur de ville retiré", `compte n° ${id(requete)}`);
      reponse.json({ ok: true, palier });
    }),
    reinitialiser: verifier(async (requete, reponse) => {
      if (!comptes) return indisponible(reponse);
      if (!(await s.lirePrenom(id(requete)))) return introuvable(reponse);
      const { jeton, expireLe } = await comptes.preparerReinitialisation(id(requete));
      const lien = creerLienReinitialisation(jeton);
      if (corpsDe(requete).envoyer === true) {
        // Envoyé directement à son adresse : le lien ne passe même pas par le logiciel
        const envoi = await s.envoyerLienMotDePasse(id(requete), lien, expireLe);
        if (envoi.ok) {
          await noter(reponse, "Lien de nouveau mot de passe envoyé par mail", `compte n° ${id(requete)}`);
          return reponse.json({ ok: true, envoye: true, expireLe });
        }
      }
      await noter(reponse, "Réinitialisation de mot de passe préparée", `compte n° ${id(requete)}`);
      reponse.json({ ok: true, envoye: false, lien, expireLe });
    }),
    retirer: verifier(async (requete, reponse) => {
      const retire = await s.retirerDuProgramme(id(requete));
      if (!retire) return introuvable(reponse);
      await noter(reponse, "Retiré du programme ambassadeur", `compte n° ${id(requete)} gardé`);
      reponse.json({ ok: true });
    }),
    supprimer: verifier(async (requete, reponse) => {
      const supprime = await s.supprimerCompte(id(requete));
      if (!supprime) return introuvable(reponse);
      await noter(reponse, "Compte SOS Miam supprimé (app comprise)", `compte n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
    exporter: verifier(async (_requete, reponse) => {
      const csv = await s.exporterAmbassadeurs();
      await noter(reponse, "Export des ambassadeurs (CSV)");
      reponse.type("text/csv; charset=utf-8").send(`﻿${csv}`);
    }),
    classement: verifier(async (_requete, reponse) => reponse.json(await s.lireClassement())),
    couverture: verifier(async (_requete, reponse) => reponse.json(await s.lireCouverture())),

    missions: verifier(async (requete, reponse) => reponse.json(await s.listerMissions(lireParametre(requete.query.statut, 10)))),
    creerMission: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const compteId = lireNombre(corps, "compteId", 1, 1e9);
      if (!compteId) throw new ChampInvalide("compteId");
      let echeance: Date | null = null;
      if (typeof corps.echeance === "string" && corps.echeance) {
        echeance = new Date(corps.echeance);
        if (Number.isNaN(echeance.getTime())) throw new ChampInvalide("echeance");
      }
      const mission = await s.creerMission({
        compteId,
        titre: lireTexte(corps, "titre", 100, true),
        detail: lireTexte(corps, "detail", 2000) ?? "",
        lieuId: lireNombre(corps, "lieuId", 1, 1e9),
        echeance,
      });
      if (!mission) return reponse.status(400).json({ ok: false, erreur: "ambassadeur-non-actif" });
      await noter(reponse, "Mission confiée", `${mission.titre} → compte n° ${compteId}`);
      reponse.status(201).json(mission);
    }),
    statutMission: verifier(async (requete, reponse) => {
      const statut = lireChoix(corpsDe(requete), "statut", ["a-faire", "annulee"] as const);
      if (!(await s.changerStatutMission(id(requete), statut))) return introuvable(reponse);
      await noter(reponse, statut === "annulee" ? "Mission annulée" : "Mission remise à faire", `mission n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
    supprimerMission: verifier(async (requete, reponse) => {
      if (!(await s.supprimerMission(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Mission supprimée", `mission n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),

    messages: verifier(async (_requete, reponse) => reponse.json(await s.listerMessages())),
    envoyerMessage: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const compteId = corps.compteId === null || corps.compteId === undefined ? null : lireNombre(corps, "compteId", 1, 1e9);
      const message = await s.envoyerMessage(compteId, lireTexte(corps, "titre", 100, true), lireTexte(corps, "texte", 3000, true));
      if (!message) return introuvable(reponse);
      await noter(reponse, "Message aux ambassadeurs", `${message.titre} → ${compteId ? `compte n° ${compteId}` : "tous les actifs"}`);
      reponse.status(201).json(message);
    }),
    supprimerMessage: verifier(async (requete, reponse) => {
      if (!(await s.supprimerMessage(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Message aux ambassadeurs retiré", `message n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
  };
}
