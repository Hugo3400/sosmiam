// Espace d'un ambassadeur validé (« actif », vérifié par exigerAmbassadeurActif) : sa candidature « fondateur » et ses
// propositions de lieux. Les missions et les messages sont dans routes/espace-ambassadeur.ts.
import type { Request, Response } from "express";

import type { NouvelleCandidature, NouvelleProposition } from "../services/comptes-espace.ts";
import { estRobot, lireCompteId, lireCorps } from "./comptes-champs.ts";
import type { ServicesComptes } from "./comptes.ts";
import { ChampInvalide, lireListe, lireTexte } from "./gestion/lire-champs.ts";

/** Ce que l'ambassadeur aimerait faire (au moins une envie) */
const ENVIES = ["denicher", "fiches", "selections", "faire-savoir"];
/** Mêmes types de lieux que « J'inscris mon lieu » (controleurs/demandes-lieux.ts) */
const TYPES_LIEUX = ["resto", "patisserie", "bar", "sortie", "autre"];

/** Texte obligatoire de `minimum` à `maximum` caractères (sauts de ligne gardés). */
function lireTexteLong(corps: Record<string, unknown>, champ: string, minimum: number, maximum: number): string {
  const texte = lireTexte(corps, champ, maximum, true);
  if (texte.length < minimum) throw new ChampInvalide(champ);
  return texte;
}

/** Les champs de la candidature, dans l'ordre du formulaire. */
function lireChampsCandidature(corps: Record<string, unknown>): NouvelleCandidature {
  const pepites = lireTexteLong(corps, "pepites", 20, 1500);
  const envies = lireListe(corps, "envies", ENVIES.length, 20, ENVIES);
  if (envies.length === 0) throw new ChampInvalide("envies");
  const reseaux = lireTexte(corps, "reseaux", 200);
  const motivation = lireTexteLong(corps, "motivation", 20, 600);
  if (typeof corps.partantRencontre !== "boolean") throw new ChampInvalide("partantRencontre");
  const connuPar = lireTexte(corps, "connuPar", 120);
  return { pepites, envies, reseaux, motivation, partantRencontre: corps.partantRencontre, connuPar };
}

/** Une pépite proposée : mêmes règles que « J'inscris mon lieu » (POST /demandes-lieux), sans la partie contact. */
function lireChampsProposition(corps: Record<string, unknown>): NouvelleProposition {
  const nom = lireTexte(corps, "nom", 80, true);
  const type = typeof corps.type === "string" && TYPES_LIEUX.includes(corps.type) ? corps.type : null;
  const ville = lireTexte(corps, "ville", 80, true);
  const adresse = lireTexte(corps, "adresse", 160);
  const description = lireTexteLong(corps, "description", 20, 1000);
  const plat = lireTexte(corps, "plat", 80);
  const horaires = lireTexte(corps, "horaires", 160);
  const siteWeb = lireTexte(corps, "siteWeb", 200);
  if (siteWeb && !/^https?:\/\/\S+$/.test(siteWeb)) throw new ChampInvalide("siteWeb");
  const instagram = lireTexte(corps, "instagram", 60)?.replace(/^@/, "") || null;
  return { nom, type, ville, adresse, description, plat, horaires, siteWeb, instagram };
}

export function creerControleursEspaceComptes(services: ServicesComptes) {
  return {
    /** GET /comptes/moi/candidature : sa dernière candidature fondateur (ou null), et les places de fondateur encore libres. */
    async lireCandidature(_requete: Request, reponse: Response) {
      const [candidature, placesRestantes] = await Promise.all([services.lireCandidature(lireCompteId(reponse)), services.compterPlacesFondateur()]);
      reponse.json({ ok: true, candidature, placesRestantes });
    },

    /**
     * POST /comptes/moi/candidature : une seule à la fois (409 « candidature-existante » s'il en a une en attente ou
     * acceptée), et seulement s'il reste une place de fondateur (409 « plus-de-place » sinon : inutile de remplir le
     * formulaire pour rien ; une page restée ouverte ou un envoi sans JavaScript arrivent aussi ici).
     */
    async candidater(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      if (estRobot(corps)) return reponse.status(201).json({ ok: true });
      if ((await services.compterPlacesFondateur()) === 0) return reponse.status(409).json({ ok: false, erreur: "plus-de-place" });
      if (!(await services.creerCandidature(lireCompteId(reponse), lireChampsCandidature(corps)))) {
        return reponse.status(409).json({ ok: false, erreur: "candidature-existante" });
      }
      reponse.status(201).json({ ok: true });
    },

    /** GET /comptes/moi/propositions : ses propositions de lieux et leur statut. */
    async listerPropositions(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, propositions: await services.listerPropositions(lireCompteId(reponse)) });
    },

    /** POST /comptes/moi/propositions : la pépite rejoint la file des demandes du logiciel de gestion. */
    async proposer(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      if (estRobot(corps)) return reponse.status(201).json({ ok: true });
      await services.creerProposition(lireCompteId(reponse), lireChampsProposition(corps));
      reponse.status(201).json({ ok: true });
    },
  };
}
