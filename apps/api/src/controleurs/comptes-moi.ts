// « Mon compte » (toute personne connectée, quel que soit son statut) : changer prénom, ville et quartier, changer de
// mot de passe, effacer son compte. Le mot de passe actuel est demandé pour les deux derniers, avec la même attente par
// compte que la connexion après plusieurs erreurs.
import type { Request, Response } from "express";

import { validerMotDePasse } from "../fonctions/comptes/valider-mot-de-passe.ts";
import { hacherMotDePasse } from "../fonctions/securite/hacher-mot-de-passe.ts";
import { verifierMotDePasse } from "../fonctions/securite/verifier-mot-de-passe.ts";
import { lireJetonSession } from "../middlewares/proteger-comptes.ts";
import type { ModificationCompte } from "../services/comptes.ts";
import { faireAttendre } from "./comptes-attente.ts";
import { lireCompteId, lireCorps, lireLigne, lireLigneFacultative, lireMotDePasse } from "./comptes-champs.ts";
import type { ContexteComptes } from "./comptes.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

export function creerControleursMonCompte({ services, protection, attente }: ContexteComptes) {
  const sessionExpiree = (reponse: Response) => reponse.status(401).json({ ok: false, erreur: "session-expiree" });

  /** Vérifie le mot de passe actuel ; sinon la réponse (403, ou 429 s'il faut patienter) est déjà partie et c'est faux. */
  async function verifierMotDePasseActuel(reponse: Response, identifiants: { email: string; motDePasse: string }, actuel: string) {
    if (faireAttendre(attente, reponse, identifiants.email)) return false;
    if (!actuel || !(await verifierMotDePasse(actuel, identifiants.motDePasse))) {
      attente.noterEchec(identifiants.email);
      reponse.status(403).json({ ok: false, erreur: "mot-de-passe-incorrect" });
      return false;
    }
    attente.oublier(identifiants.email);
    return true;
  }

  return {
    /** PATCH /comptes/moi : { prenom?, ville?, quartier? } (quartier "" : effacé) → le compte à jour. */
    async modifier(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const modification: ModificationCompte = {};
      if (corps.prenom !== undefined) modification.prenom = lireLigne(corps, "prenom", 1, 40);
      if (corps.ville !== undefined) modification.ville = lireLigne(corps, "ville", 2, 80);
      if (corps.quartier !== undefined) modification.quartier = lireLigneFacultative(corps, "quartier", 80);
      const id = lireCompteId(reponse);
      if (Object.keys(modification).length > 0) await services.modifierCompte(id, modification);
      const compte = await services.lireCompte(id);
      if (!compte) return sessionExpiree(reponse);
      reponse.json({ ok: true, compte });
    },

    /** POST /comptes/moi/mot-de-passe : { actuel, nouveau }. Les autres sessions du compte sont fermées. */
    async changerMotDePasse(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const id = lireCompteId(reponse);
      const identifiants = await services.lireIdentifiants(id);
      if (!identifiants) return sessionExpiree(reponse);
      const nouveau = lireMotDePasse(corps, "nouveau");
      if (!validerMotDePasse(nouveau, identifiants.email)) throw new ChampInvalide("nouveau");
      if (!(await verifierMotDePasseActuel(reponse, identifiants, lireMotDePasse(corps, "actuel")))) return;
      await services.changerMotDePasse(id, await hacherMotDePasse(nouveau));
      await protection.fermerSessionsDuCompte(id, lireJetonSession(requete) ?? undefined);
      reponse.json({ ok: true });
    },

    /** DELETE /comptes/moi : { motDePasse }. Tout est effacé, en cascade (ses sessions comprises). */
    async supprimer(requete: Request, reponse: Response) {
      const id = lireCompteId(reponse);
      const identifiants = await services.lireIdentifiants(id);
      if (!identifiants) return sessionExpiree(reponse);
      if (!(await verifierMotDePasseActuel(reponse, identifiants, lireMotDePasse(lireCorps(requete), "motDePasse")))) return;
      await services.effacerCompte(id);
      await protection.fermerSessionsDuCompte(id);
      reponse.json({ ok: true });
    },
  };
}
