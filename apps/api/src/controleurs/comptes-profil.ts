// Profil de l'app (toute personne connectée) : le lire déchiffré, le modifier (jamais la date de naissance), savoir si un
// pseudo est libre. Contrat : routes/comptes.ts. Jamais de nom, de date de naissance ni de pseudo dans un journal.
import type { Request, Response } from "express";

import { estPseudoValide } from "../../../../packages/commun/src/validation/est-pseudo-valide.ts";
import { nomPublicContientMotInterdit } from "../../../../packages/commun/src/validation/nom-public-contient-mot-interdit.ts";
import { calculerAgeProfil } from "../fonctions/comptes/calculer-age-profil.ts";
import type { CompteSession } from "../middlewares/proteger-comptes.ts";
import type { ModificationProfil, ProfilLu } from "../services/comptes-profil.ts";
import { lireCompteId, lireCorps, lireLigne, lirePrenom } from "./comptes-champs.ts";
import { lireAvatar, lireEnvies, lireNomChiffre, lirePseudo, normaliserPseudo, relireEnvies } from "./comptes-profil-champs.ts";
import { repondreChiffrementIndisponible, type ContexteComptes } from "./comptes.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

/** Un compte créé sur le site a juré ses 18 ans : la date donnée ensuite dans l'app doit le confirmer */
const AGE_COMPTE_DU_SITE = 18;

/** Le profil tel que l'app le reçoit (GET et PATCH /comptes/moi/profil) */
export type ProfilVu = {
  prenom: string;
  nom: string | null;
  pseudo: string | null;
  /** « AAAA-MM-JJ », ou null (compte du site, qui ne la garde pas) */
  dateNaissance: string | null;
  ville: string | null;
  envies: Record<string, string[]>;
  avatar: string | null;
  prive: boolean;
  emailVerifie: boolean;
  /** Âge au jour de Paris, ou null sans date de naissance */
  age: number | null;
};

export function creerControleursProfil({ services, chiffrement, horloge }: ContexteComptes) {
  const sessionExpiree = (reponse: Response) => reponse.status(401).json({ ok: false, erreur: "session-expiree" });

  /** Déchiffre le nom et la date (une donnée illisible lève une erreur : 500, sans rien citer). */
  function decrireProfil(profil: ProfilLu): ProfilVu {
    if (!chiffrement) throw new Error("chiffrement indisponible");
    const nom = profil.nomChiffre === null ? null : chiffrement.dechiffrer(profil.nomChiffre, "nom");
    const dateNaissance = profil.dateNaissanceChiffree === null ? null : chiffrement.dechiffrer(profil.dateNaissanceChiffree, "dateNaissance");
    return {
      prenom: profil.prenom, nom, pseudo: profil.pseudo, dateNaissance, ville: profil.ville, envies: relireEnvies(profil.envies),
      avatar: profil.avatar, prive: profil.prive, emailVerifie: profil.emailVerifie,
      age: dateNaissance === null ? null : calculerAgeProfil(dateNaissance, new Date(horloge())),
    };
  }

  /** Ce que la demande veut changer ; champs absents : inchangés. */
  /** `prenomActuel` : le prénom enregistré, qui passe toujours (lirePrenom) */
  function lireModification(corps: Record<string, unknown>, prenomActuel: string): ModificationProfil {
    // La date de naissance : seulement si le compte n'en a aucune (lue à part, dans modifier) ; sinon l'équipe la corrige
    // sur demande (« Écris-nous »)
    const modification: ModificationProfil = {};
    if (corps.prenom !== undefined) modification.prenom = lirePrenom(corps, prenomActuel);
    if (corps.nom !== undefined && chiffrement) modification.nomChiffre = lireNomChiffre(corps, chiffrement);
    if (corps.pseudo !== undefined) modification.pseudo = lirePseudo(corps.pseudo);
    if (corps.ville !== undefined) modification.ville = lireLigne(corps, "ville", 2, 80);
    if (corps.envies !== undefined) modification.envies = lireEnvies(corps.envies);
    if (corps.avatar !== undefined) modification.avatar = lireAvatar(corps.avatar);
    if (corps.prive !== undefined) {
      if (typeof corps.prive !== "boolean") throw new ChampInvalide("prive");
      modification.prive = corps.prive;
    }
    return modification;
  }

  return {
    /** GET /comptes/moi/profil */
    async lire(_requete: Request, reponse: Response) {
      if (!chiffrement) return repondreChiffrementIndisponible(reponse);
      const profil = await services.lireProfil(lireCompteId(reponse));
      if (!profil) return sessionExpiree(reponse);
      reponse.json({ ok: true, profil: decrireProfil(profil) });
    },

    /** PATCH /comptes/moi/profil : { prenom?, nom?, pseudo?, ville?, envies?, avatar?, prive? } → le profil à jour. */
    async modifier(requete: Request, reponse: Response) {
      if (!chiffrement) return repondreChiffrementIndisponible(reponse);
      const id = lireCompteId(reponse);
      const corps = lireCorps(requete);
      const modification = lireModification(corps, (reponse.locals.compte as CompteSession).prenom);
      // Compte du site (ambassadeur, pro) qui arrive dans l'app : il donne sa date une fois, et elle doit confirmer les
      // 18 ans juré à l'inscription. Ensuite, plus jamais ici.
      if (corps.dateNaissance !== undefined) {
        const actuel = await services.lireProfil(id);
        if (!actuel) return sessionExpiree(reponse);
        if (actuel.dateNaissanceChiffree !== null) throw new ChampInvalide("dateNaissance");
        const date = typeof corps.dateNaissance === "string" ? corps.dateNaissance : null;
        const age = date === null ? null : calculerAgeProfil(date, new Date(horloge()));
        if (date === null || age === null) throw new ChampInvalide("dateNaissance");
        if (age < AGE_COMPTE_DU_SITE) return reponse.status(403).json({ ok: false, erreur: "age-minimum" });
        modification.dateNaissanceChiffree = chiffrement.chiffrer(date, "dateNaissance");
      }
      // Pseudo porté par un autre, ou réservé pour un autre (libéré depuis moins de 30 jours) : la même réponse « pris »
      const maintenant = new Date(horloge());
      if (modification.pseudo !== undefined && (await services.pseudoEstPris(modification.pseudo, id, maintenant))) {
        return reponse.status(409).json({ ok: false, erreur: "pseudo-pris" });
      }
      // Deux comptes qui prennent le même pseudo au même moment : la base n'en garde qu'un
      if (Object.keys(modification).length > 0 && (await services.modifierProfil(id, modification, maintenant)) === "pseudo-pris") {
        return reponse.status(409).json({ ok: false, erreur: "pseudo-pris" });
      }
      const profil = await services.lireProfil(id);
      if (!profil) return sessionExpiree(reponse);
      reponse.json({ ok: true, profil: decrireProfil(profil) });
    },

    /**
     * GET /comptes/pseudo-disponible?pseudo= : libre ou pas (le sien compte comme libre, et son ancien pseudo encore réservé
     * pour lui aussi). Réservé pour un autre : « pris », comme un pseudo porté. Forme invalide : 400 ; gros mot : jamais disponible.
     */
    async pseudoDisponible(requete: Request, reponse: Response) {
      const pseudo = normaliserPseudo(requete.query.pseudo);
      if (!estPseudoValide(pseudo)) throw new ChampInvalide("pseudo");
      const disponible = !nomPublicContientMotInterdit(pseudo) && !(await services.pseudoEstPris(pseudo, lireCompteId(reponse), new Date(horloge())));
      reponse.json({ ok: true, disponible });
    },
  };
}
