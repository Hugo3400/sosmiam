// Candidature au titre d'« ambassadeur certifié » depuis l'espace (ambassadeur « actif » seulement, vérifié par
// exigerAmbassadeurActif) : la lire, l'envoyer. La décision (accepter, refuser, retirer le titre) se prend dans le
// logiciel de gestion. Contrat des adresses : routes/comptes.ts.
import type { Request, Response } from "express";

import { decrireCommune } from "../fonctions/geo/decrire-commune.ts";
import { lireCodeCommune } from "../fonctions/geo/lire-code-commune.ts";
import {
  ENVIES_CERTIFICATION, PROFILS_CERTIFIES, type CandidatureCertificationBrute, type NouvelleCandidatureCertification,
} from "../services/certification.ts";
import { estRobot, lireCompteId, lireCorps, lireLigneFacultative } from "./comptes-champs.ts";
import type { ServicesComptes } from "./comptes.ts";
import { ChampInvalide, lireChoix, lireListe } from "./gestion/lire-champs.ts";

/** « Comment tu aides déjà les lieux » : 600 caractères au plus */
const AIDE_MAX = 600;
const ENVIES: readonly string[] = ENVIES_CERTIFICATION;

/** Texte libre obligatoire, sauts de ligne gardés (\r\n compté comme un seul), espaces répétés réduits, 1 à 600 caractères. */
function lireAide(corps: Record<string, unknown>): string {
  const valeur = corps.aide;
  if (typeof valeur !== "string") throw new ChampInvalide("aide");
  const propre = valeur.normalize("NFC").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (propre.length < 1 || propre.length > AIDE_MAX) throw new ChampInvalide("aide");
  return propre;
}

/** La commune choisie, par son code INSEE (un arrondissement compte pour sa ville) ; 400 sur « communeCode » sinon. */
function lireCommune(corps: Record<string, unknown>): string {
  const code = lireCodeCommune(corps.communeCode);
  const commune = code ? decrireCommune(code) : null;
  if (!commune) throw new ChampInvalide("communeCode");
  return commune.code;
}

/** Les champs, dans l'ordre du formulaire ; le premier qui ne va pas répond 400 « champ-invalide » avec son nom. */
function lireChampsCertification(corps: Record<string, unknown>): NouvelleCandidatureCertification {
  const profil = lireChoix(corps, "profil", PROFILS_CERTIFIES);
  const structure = lireLigneFacultative(corps, "structure", 100);
  const communeCode = lireCommune(corps);
  const aide = lireAide(corps);
  const choisies = lireListe(corps, "envies", ENVIES.length, 20, ENVIES);
  if (choisies.length === 0) throw new ChampInvalide("envies");
  if (corps.engagementGratuit !== true) throw new ChampInvalide("engagementGratuit");
  // Rangées dans l'ordre du formulaire, quel que soit l'ordre reçu
  const envies = ENVIES.filter((envie) => choisies.includes(envie));
  return { profil, structure, communeCode, aide, envies, engagementGratuit: true };
}

/** La candidature telle que la personne la voit : sa commune décrite, ses envies en liste ; jamais le texte de l'aide. */
function decrireCandidature({ statut, profil, structure, communeCode, envies, creeLe, reponduLe }: CandidatureCertificationBrute) {
  const commune = decrireCommune(communeCode);
  return {
    statut, profil, structure,
    commune: commune && { code: commune.code, nom: commune.nom, nomDepartement: commune.nomDepartement },
    envies, creeLe, reponduLe,
  };
}

export function creerControleursCertification(services: ServicesComptes) {
  return {
    /** GET /comptes/moi/certification : son titre (ou null) et sa dernière candidature (ou null). */
    async lire(_requete: Request, reponse: Response) {
      const compteId = lireCompteId(reponse);
      const [compte, brute] = await Promise.all([services.lireCompte(compteId), services.lireCandidatureCertification(compteId)]);
      reponse.json({ ok: true, certifie: compte?.ambassadeur?.certifie ?? null, candidature: brute ? decrireCandidature(brute) : null });
    },

    /**
     * POST /comptes/moi/certification : 201 si elle est enregistrée ; 409 « deja-certifie » ou « candidature-existante »
     * (une en attente). Champ piège rempli : 201, rien n'est gardé.
     */
    async candidater(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      if (estRobot(corps)) return reponse.status(201).json({ ok: true });
      const resultat = await services.creerCandidatureCertification(lireCompteId(reponse), lireChampsCertification(corps));
      if (resultat !== "ok") return reponse.status(409).json({ ok: false, erreur: resultat });
      reponse.status(201).json({ ok: true });
    },
  };
}
