// Rattachement d'un compte à ses lieux (espace pro) : ses demandes et invitations, demander à gérer un lieu, accepter une
// invitation dans une équipe, quitter, et « Chercher mon lieu ». Contrat : routes/comptes.ts et routes/pro.ts.
import type { Request, Response } from "express";

import { verifierSiret } from "../fonctions/pro/verifier-siret.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ServicesPro } from "../services/pro-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

const PREUVE_MAX = 600;
/** Caractères de contrôle, sauf le retour à la ligne (la preuve peut tenir sur plusieurs lignes) */
const CONTROLES = /[\u0000-\u0009\u000B-\u001F\u007F]/g;

/** La preuve : 1 à 600 caractères, espaces autour retirés */
function lirePreuve(corps: Record<string, unknown>): string {
  const preuve = typeof corps.preuve === "string" ? corps.preuve.replace(CONTROLES, " ").trim() : "";
  if (preuve.length < 1 || preuve.length > PREUVE_MAX) throw new ChampInvalide("preuve");
  return preuve;
}

/** Le SIRET facultatif : 14 chiffres (espaces et points tolérés) avec une clé de Luhn juste ; null s'il est absent ou vide */
function lireSiret(corps: Record<string, unknown>): string | null {
  const brut = corps.siret;
  if (brut === undefined || brut === null) return null;
  if (typeof brut !== "string") throw new ChampInvalide("siret");
  const siret = brut.replace(/[\s.]/g, "");
  if (siret === "") return null;
  if (!verifierSiret(siret)) throw new ChampInvalide("siret");
  return siret;
}

/** « Chercher mon lieu » : 2 à 80 caractères, 5 mots au plus */
function lireMots(brut: unknown): string[] {
  const texte = typeof brut === "string" ? brut.replace(/\s+/g, " ").trim() : "";
  if (texte.length < 2 || texte.length > 80) throw new ChampInvalide("texte");
  return texte.split(" ").slice(0, 5);
}

export function creerControleursRattachements(services: ServicesPro, horloge: () => number) {
  return {
    /** GET /comptes/moi/rattachements */
    async lister(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, rattachements: await services.listerRattachements(lireCompteId(reponse)) });
    },

    /** POST /comptes/moi/rattachements : { lieuId, role: "gerant", preuve, siret? } */
    async demander(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const { lieuId } = corps;
      if (typeof lieuId !== "number" || !Number.isSafeInteger(lieuId) || lieuId < 1) throw new ChampInvalide("lieuId");
      if (corps.role !== "gerant") throw new ChampInvalide("role");
      const demande = { lieuId, preuve: lirePreuve(corps), siret: lireSiret(corps) };
      const resultat = await services.demanderRattachement(lireCompteId(reponse), demande, new Date(horloge()));
      if (resultat.ok) return reponse.status(201).json({ ok: true, id: resultat.id });
      reponse.status(resultat.erreur === "lieu-inconnu" ? 404 : 409).json({ ok: false, erreur: resultat.erreur });
    },

    /** POST /comptes/moi/rattachements/:id/accepter (l'employé invité) */
    async accepter(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const fait = id !== null && (await services.accepterInvitation(lireCompteId(reponse), id, new Date(horloge())));
      if (!fait) return reponse.status(404).json({ ok: false, erreur: "invitation-inconnue" });
      reponse.json({ ok: true });
    },

    /** DELETE /comptes/moi/rattachements/:id : refuser une invitation, annuler sa demande ou quitter un lieu */
    async quitter(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const fait = id !== null && (await services.quitterRattachement(lireCompteId(reponse), id, new Date(horloge())));
      if (!fait) return reponse.status(404).json({ ok: false, erreur: "rattachement-inconnu" });
      reponse.json({ ok: true });
    },

    /** GET /pro/recherche-lieux?texte= */
    async chercher(requete: Request, reponse: Response) {
      reponse.json({ ok: true, lieux: await services.chercherLieux(lireMots(requete.query.texte)) });
    },
  };
}
