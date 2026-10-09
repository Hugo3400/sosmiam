// « Mon compte » (toute personne connectée, quel que soit son statut) : changer prénom, ville et quartier, changer de
// mot de passe, se déconnecter partout, effacer son compte. Le mot de passe actuel est demandé pour les deux derniers, avec une attente propre au
// compte connecté après plusieurs erreurs (clé : son id) : quelqu'un qui connaît seulement l'e-mail, et bloque la
// connexion avec des mots de passe faux, n'empêche pas le titulaire connecté de changer de mot de passe.
import type { Request, Response } from "express";

import { validerMotDePasse } from "../fonctions/comptes/valider-mot-de-passe.ts";
import { hacherMotDePasse } from "../fonctions/securite/hacher-mot-de-passe.ts";
import { verifierMotDePasse } from "../fonctions/securite/verifier-mot-de-passe.ts";
import type { CompteSession } from "../middlewares/proteger-comptes.ts";
import type { ModificationCompte } from "../services/comptes.ts";
import { faireAttendre, verifierEnComptant } from "./comptes-attente.ts";
import { lireCompteId, lireCorps, lireLigne, lireLigneFacultative, lireMotDePasse } from "./comptes-champs.ts";
import type { ContexteComptes } from "./comptes.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

export function creerControleursMonCompte({ services, protection, attente, attenteConnectee, lireCompteVu }: ContexteComptes) {
  const sessionExpiree = (reponse: Response) => reponse.status(401).json({ ok: false, erreur: "session-expiree" });

  /**
   * Vérifie le mot de passe actuel, l'essai compté d'abord (des essais lancés en même temps ne passent pas tous) ; sinon
   * la réponse (403, ou 429 s'il faut patienter) est déjà partie et c'est faux. Bon : l'attente de la connexion repart
   * aussi de zéro.
   */
  async function verifierMotDePasseActuel(reponse: Response, id: number, identifiants: { email: string; motDePasse: string }, actuel: string) {
    const cle = String(id);
    if (faireAttendre(attenteConnectee, reponse, cle)) return false;
    const bon = await verifierEnComptant(attenteConnectee, cle, async () => actuel !== "" && (await verifierMotDePasse(actuel, identifiants.motDePasse)));
    if (!bon) {
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
      const compte = await lireCompteVu(id);
      if (!compte) return sessionExpiree(reponse);
      reponse.json({ ok: true, compte });
    },

    /**
     * POST /comptes/moi/mot-de-passe : { actuel, nouveau } → { ok, session }. Toutes les sessions du compte sont fermées,
     * celle en cours comprise, et un nouveau jeton la remplace (une copie volée de l'ancien ne sert plus à rien) : le site
     * le pose dans son cookie.
     */
    async changerMotDePasse(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const id = lireCompteId(reponse);
      const identifiants = await services.lireIdentifiants(id);
      if (!identifiants) return sessionExpiree(reponse);
      const nouveau = lireMotDePasse(corps, "nouveau");
      if (!validerMotDePasse(nouveau, identifiants.email)) throw new ChampInvalide("nouveau");
      if (!(await verifierMotDePasseActuel(reponse, id, identifiants, lireMotDePasse(corps, "actuel")))) return;
      await services.changerMotDePasse(id, await hacherMotDePasse(nouveau));
      await protection.fermerSessionsDuCompte(id);
      // Le nouveau jeton garde le support de la session en cours (site ou app)
      reponse.json({ ok: true, session: await protection.ouvrirSession(id, (reponse.locals.compte as CompteSession).support) });
    },

    /** POST /comptes/moi/deconnecter-partout : toutes les sessions du compte (site et app) sont fermées, celle-ci comprise. */
    async deconnecterPartout(_requete: Request, reponse: Response) {
      await protection.fermerSessionsDuCompte(lireCompteId(reponse));
      reponse.json({ ok: true });
    },

    /** DELETE /comptes/moi : { motDePasse }. Tout est effacé, en cascade (ses sessions comprises). */
    async supprimer(requete: Request, reponse: Response) {
      const id = lireCompteId(reponse);
      const identifiants = await services.lireIdentifiants(id);
      if (!identifiants) return sessionExpiree(reponse);
      if (!(await verifierMotDePasseActuel(reponse, id, identifiants, lireMotDePasse(lireCorps(requete), "motDePasse")))) return;
      await services.effacerCompte(id);
      await protection.fermerSessionsDuCompte(id);
      reponse.json({ ok: true });
    },
  };
}
