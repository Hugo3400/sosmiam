// SOS « place ce soir » et message du moment, par l'équipe du lieu (voir routes/comptoir.ts). Le gérant et l'équipe peuvent les
// régler ; un SOS par jour (jour de Paris), jusqu'à la fermeture ; un message qui s'efface tout seul, 24 h au plus.
import type { Request, Response } from "express";

import { calculerFermetureDuJour } from "../../../../packages/commun/src/fonctions/lieux/calculer-fermeture-du-jour.ts";
import { calculerInstantParis } from "../../../../packages/commun/src/fonctions/temps/calculer-instant-paris.ts";
import {
  DUREE_MESSAGE_MOMENT_MAX_MS, HEURE_LIMITE_SANS_HORAIRES, MESSAGE_MOMENT_MAX, SOS_OFFRE_MAX, SOS_PLACES_MAX, SOS_PLACES_MIN,
} from "../../../../packages/commun/src/regles/sos-lieu.ts";
import type { MomentLieu } from "../../../../packages/commun/src/types/moment-lieu.ts";
import { contientMotInterdit } from "../../../../packages/commun/src/validation/contient-mot-interdit.ts";
import { calculerClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ServicesMomentLieu } from "../services/moment-lieu-regles.ts";
import type { RoleRattachement } from "../services/pro-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { champInvalide } from "./visites.ts";

const JOUR_MS = 24 * 3600_000;
const jourDeParis = (instant: Date) => calculerClesPeriodes(instant).jour;

/** Minuit (heure de Paris) du jour de `maintenant` : le « jour » d'un SOS */
const debutDuJour = (maintenant: Date) => new Date(calculerInstantParis(jourDeParis(maintenant), "00:00"));

/** Sans horaires : 4 h du matin qui vient (heure de Paris) */
function limiteSansHoraires(maintenant: Date): Date {
  const ceMatin = calculerInstantParis(jourDeParis(maintenant), HEURE_LIMITE_SANS_HORAIRES);
  return new Date(ceMatin > maintenant.getTime() ? ceMatin : calculerInstantParis(jourDeParis(new Date(maintenant.getTime() + JOUR_MS)), HEURE_LIMITE_SANS_HORAIRES));
}

/** Un texte facultatif : null s'il est absent ou vide, undefined s'il ne va pas (trop long, gros mot, pas un texte) */
function lireTexte(brut: unknown, max: number): string | null | undefined {
  if (brut === undefined || brut === null) return null;
  if (typeof brut !== "string") return undefined;
  const texte = brut.trim().replace(/\s+/g, " ");
  if (texte === "") return null;
  return texte.length > max || contientMotInterdit(texte) ? undefined : texte;
}

/** Une heure de fin facultative (ISO 8601) : null si absente, undefined si illisible */
function lireFin(brut: unknown): Date | null | undefined {
  if (brut === undefined || brut === null) return null;
  const date = typeof brut === "string" ? new Date(brut) : null;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
}

export function creerControleursMomentLieu(services: ServicesMomentLieu, roleDe: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>, horloge: () => number) {
  async function lireMoment(lieuId: number, maintenant: Date): Promise<MomentLieu> {
    const [lieu, sos] = await Promise.all([services.lireLieu(lieuId), services.lireSosDepuis(lieuId, debutDuJour(maintenant))]);
    const fermeture = lieu ? calculerFermetureDuJour(lieu.ouverture, maintenant) : null;
    const messageVisible = lieu?.alerte && (!lieu.alerteJusqua || lieu.alerteJusqua > maintenant);
    return {
      sos: sos
        ? {
            places: sos.places, offre: sos.offre, jusqua: sos.jusqua.toISOString(), lanceLe: sos.creeLe.toISOString(), lancePar: sos.lancePar,
            arreteLe: sos.arreteLe?.toISOString() ?? null, enCours: !sos.arreteLe && sos.jusqua > maintenant,
          }
        : null,
      sosPossible: !sos,
      fermeture: fermeture?.toISOString() ?? null,
      message: messageVisible ? { texte: lieu.alerte!, jusqua: lieu.alerteJusqua?.toISOString() ?? null } : null,
    };
  }

  /** Le lieu de l'adresse, si le compte est de son équipe ; sinon répond (400 ou 403) et rend null */
  async function lieuDeLEquipe(requete: Request, reponse: Response): Promise<number | null> {
    const lieuId = lireIdentifiant(requete.params.id);
    if (lieuId === null) return champInvalide(reponse, "id"), null;
    if (!(await roleDe(lireCompteId(reponse), lieuId))) return reponse.status(403).json({ ok: false, erreur: "role-requis" }), null;
    return lieuId;
  }

  const repondre = async (reponse: Response, lieuId: number) => reponse.json({ ok: true, moment: await lireMoment(lieuId, new Date(horloge())) });

  return {
    /** GET /pro/comptoir/lieux/:id/moment */
    async lire(requete: Request, reponse: Response) {
      const lieuId = await lieuDeLEquipe(requete, reponse);
      if (lieuId !== null) await repondre(reponse, lieuId);
    },

    /** POST /pro/comptoir/lieux/:id/sos { places, offre?, jusqua? } */
    async lancerSos(requete: Request, reponse: Response) {
      const lieuId = await lieuDeLEquipe(requete, reponse);
      if (lieuId === null) return;
      const corps = lireCorps(requete);
      const maintenant = new Date(horloge());
      const places = corps.places;
      if (typeof places !== "number" || !Number.isInteger(places) || places < SOS_PLACES_MIN || places > SOS_PLACES_MAX) return champInvalide(reponse, "places");
      const offre = lireTexte(corps.offre, SOS_OFFRE_MAX);
      if (offre === undefined) return champInvalide(reponse, "offre");
      const demandee = lireFin(corps.jusqua);
      if (demandee === undefined) return champInvalide(reponse, "jusqua");
      const lieu = await services.lireLieu(lieuId);
      const fermeture = lieu ? calculerFermetureDuJour(lieu.ouverture, maintenant) : null;
      // Jusqu'à la fermeture de ce soir ; sans horaires connus, il faut dire jusqu'à quand (4 h du matin au plus)
      const jusqua = demandee ?? fermeture;
      if (!jusqua || jusqua <= maintenant || jusqua > (fermeture ?? limiteSansHoraires(maintenant))) return champInvalide(reponse, "jusqua");
      const resultat = await services.lancerSos(lieuId, lireCompteId(reponse), { places, offre, jusqua }, maintenant, debutDuJour(maintenant));
      if (resultat === "deja") return reponse.status(409).json({ ok: false, erreur: "sos-deja-lance" });
      reponse.status(201).json({ ok: true, moment: await lireMoment(lieuId, maintenant) });
    },

    /** DELETE /pro/comptoir/lieux/:id/sos */
    async arreterSos(requete: Request, reponse: Response) {
      const lieuId = await lieuDeLEquipe(requete, reponse);
      if (lieuId === null) return;
      await services.arreterSos(lieuId, new Date(horloge()));
      await repondre(reponse, lieuId);
    },

    /** PUT /pro/comptoir/lieux/:id/message { texte, jusqua? } */
    async reglerMessage(requete: Request, reponse: Response) {
      const lieuId = await lieuDeLEquipe(requete, reponse);
      if (lieuId === null) return;
      const corps = lireCorps(requete);
      const maintenant = new Date(horloge());
      const texte = lireTexte(corps.texte, MESSAGE_MOMENT_MAX);
      if (!texte) return champInvalide(reponse, "texte");
      const demandee = lireFin(corps.jusqua);
      if (demandee === undefined) return champInvalide(reponse, "jusqua");
      const auPlusTard = new Date(maintenant.getTime() + DUREE_MESSAGE_MOMENT_MAX_MS);
      const lieu = await services.lireLieu(lieuId);
      const fermeture = lieu ? calculerFermetureDuJour(lieu.ouverture, maintenant) : null;
      // Sans heure donnée : jusqu'à la fermeture de ce soir, sinon 24 h
      const jusqua = demandee ?? (fermeture && fermeture < auPlusTard ? fermeture : auPlusTard);
      if (jusqua <= maintenant || jusqua > auPlusTard) return champInvalide(reponse, "jusqua");
      await services.reglerMessage(lieuId, { texte, jusqua });
      await repondre(reponse, lieuId);
    },

    /** DELETE /pro/comptoir/lieux/:id/message */
    async effacerMessage(requete: Request, reponse: Response) {
      const lieuId = await lieuDeLEquipe(requete, reponse);
      if (lieuId === null) return;
      await services.reglerMessage(lieuId, null);
      await repondre(reponse, lieuId);
    },
  };
}
