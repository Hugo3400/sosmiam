// Espace d'un ambassadeur validé (« actif », vérifié par exigerAmbassadeurActif) : sa candidature « fondateur » et ses
// propositions de lieux. Les missions et les messages sont dans routes/espace-ambassadeur.ts.
import type { Request, Response } from "express";

import { decrireCommune } from "../fonctions/geo/decrire-commune.ts";
import { lireCodeCommune } from "../fonctions/geo/lire-code-commune.ts";
import type { CandidatureBrute, CandidatureVue, NouvelleCandidature, NouvelleProposition } from "../services/comptes-espace.ts";
import type { CommuneEtZone, ServicesZones } from "../services/zones-fondateurs.ts";
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

export function creerControleursEspaceComptes(services: ServicesComptes, zones: ServicesZones) {
  /** La commune choisie (champ « communeCode ») et sa zone ; 400 « champ-invalide » si elle manque ou est inconnue. */
  async function lireCommuneEtZone(corps: Record<string, unknown>): Promise<CommuneEtZone> {
    const code = lireCodeCommune(corps.communeCode);
    const trouvee = code ? await zones.trouverZoneDeCommune(code) : null;
    if (!trouvee) throw new ChampInvalide("communeCode");
    return trouvee;
  }

  /** La candidature telle que l'ambassadeur la voit : sa commune et sa zone (places à jour), ses deux numéros. */
  async function decrireCandidature(candidature: CandidatureBrute): Promise<CandidatureVue> {
    const { statut, numeroLocal, numeroNational, communeCode, zoneCode, creeLe, reponduLe } = candidature;
    const commune = communeCode ? decrireCommune(communeCode) : null;
    const zone = zoneCode ? await zones.lireZone(zoneCode) : null;
    return {
      statut, numero: numeroLocal, numeroLocal, numeroNational,
      commune: commune && { code: commune.code, nom: commune.nom, nomDepartement: commune.nomDepartement }, zone, creeLe, reponduLe,
    };
  }

  /** Places encore libres dans toute la France (toutes zones), pour placesRestantes sans zone connue */
  async function compterPlacesLibres(): Promise<number> {
    return (await zones.listerZones()).reduce((total, zone) => total + zone.libres, 0);
  }

  return {
    /**
     * GET /comptes/moi/candidature : sa dernière candidature fondateur (ou null). `placesRestantes`, gardé pour le site
     * d'avant les fondateurs par ville : les places libres de la zone de sa candidature, ou de toute la France s'il n'a
     * pas de candidature ou qu'elle n'a pas encore de commune.
     */
    async lireCandidature(_requete: Request, reponse: Response) {
      const brute = await services.lireCandidature(lireCompteId(reponse));
      const candidature = brute ? await decrireCandidature(brute) : null;
      const placesRestantes = candidature?.zone ? candidature.zone.libres : await compterPlacesLibres();
      reponse.json({ ok: true, candidature, placesRestantes });
    },

    /**
     * POST /comptes/moi/candidature : dans la zone de sa commune (calculée ici), seulement s'il y reste une place (409
     * « plus-de-place » sinon, avant de lire le reste : inutile de remplir le formulaire pour rien), et une seule à la
     * fois (409 « candidature-existante » s'il en a une en attente ou acceptée).
     */
    async candidater(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      if (estRobot(corps)) return reponse.status(201).json({ ok: true });
      const { commune, zone } = await lireCommuneEtZone(corps);
      if (zone.libres === 0) return reponse.status(409).json({ ok: false, erreur: "plus-de-place" });
      const candidature = { ...lireChampsCandidature(corps), communeCode: commune.code, zoneCode: zone.code };
      if (!(await services.creerCandidature(lireCompteId(reponse), candidature))) {
        return reponse.status(409).json({ ok: false, erreur: "candidature-existante" });
      }
      reponse.status(201).json({ ok: true });
    },

    /**
     * POST /comptes/moi/candidature/commune : pose ou change la commune de sa candidature encore en attente (une
     * candidature d'avant les fondateurs par ville n'en a pas). Rester dans la même zone passe toujours ; une autre zone,
     * seulement s'il y reste une place.
     */
    async changerCommune(requete: Request, reponse: Response) {
      const { commune, zone } = await lireCommuneEtZone(lireCorps(requete));
      const compteId = lireCompteId(reponse);
      const actuelle = await services.lireCandidature(compteId);
      if (!actuelle) return reponse.status(404).json({ ok: false, erreur: "aucune-candidature" });
      if (actuelle.statut !== "en-attente") return reponse.status(409).json({ ok: false, erreur: "deja-traitee" });
      if (zone.libres === 0 && actuelle.zoneCode !== zone.code) return reponse.status(409).json({ ok: false, erreur: "plus-de-place" });
      const resultat = await services.changerCommuneCandidature(compteId, { communeCode: commune.code, zoneCode: zone.code });
      if (resultat === "aucune") return reponse.status(404).json({ ok: false, erreur: "aucune-candidature" });
      if (resultat === "deja-traitee") return reponse.status(409).json({ ok: false, erreur: "deja-traitee" });
      const apres = await services.lireCandidature(compteId);
      reponse.json({ ok: true, candidature: apres ? await decrireCandidature(apres) : null });
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
