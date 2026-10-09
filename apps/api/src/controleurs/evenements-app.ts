// Ce que l'app lit et fait avec les événements des lieux (voir routes/evenements.ts) : les dates visibles (Explorer, fiche du
// lieu), sans session, et « Ça m'intéresse », avec session. Un 15-17 ans ne voit ni ne suit un événement avec alcool.
import type { Request, Response } from "express";

import { calculerProchaineOccurrence } from "../../../../packages/commun/src/fonctions/evenements/calculer-prochaine-occurrence.ts";
import { estEvenementAlcool } from "../../../../packages/commun/src/fonctions/evenements/est-evenement-alcool.ts";
import {
  EVENEMENTS_PAR_LECTURE, EVENEMENTS_PAR_LIEU, HORIZON_EVENEMENT_MS, JOUR_MS, PERIODE_EVENEMENTS_MAX_MS,
} from "../../../../packages/commun/src/regles/evenements.ts";
import type { MonInteretEvenement } from "../../../../packages/commun/src/types/evenement.ts";
import { listerDatesVisibles } from "../fonctions/evenements/lister-dates-visibles.ts";
import { presenterEvenementPublic } from "../fonctions/evenements/presenter-evenement-public.ts";
import { estMajeurVisiteur } from "../fonctions/visites/est-majeur-visiteur.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ChiffrementDonnees } from "../services/chiffrement-donnees.ts";
import type { EvenementAvecLieu, ServicesEvenements } from "../services/evenements-regles.ts";
import type { ZoneLieux } from "../services/lieux-app-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { champInvalide } from "./visites.ts";

export type DependancesEvenementsApp = {
  services: ServicesEvenements;
  /** Pour l'âge (événements avec alcool) ; null : clé absente, un compte avec une date gardée compte comme 15-17 ans */
  chiffrement: ChiffrementDonnees | null;
};

const FORME_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/** Un nombre lu dans l'adresse (?nord=43.7), entre deux bornes ; null s'il manque ou ne va pas */
function lireNombre(brut: unknown, min: number, max: number): number | null {
  if (typeof brut !== "string" || brut.trim() === "") return null;
  const n = Number(brut);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** La zone demandée : les quatre bords ou aucun ; undefined si elle ne va pas (comme GET /app/lieux) */
function lireZone(q: Request["query"]): ZoneLieux | null | undefined {
  if ([q.nord, q.sud, q.ouest, q.est].every((b) => b === undefined)) return null;
  const [nord, sud, ouest, est] = [lireNombre(q.nord, -90, 90), lireNombre(q.sud, -90, 90), lireNombre(q.ouest, -180, 180), lireNombre(q.est, -180, 180)];
  if (nord === null || sud === null || ouest === null || est === null || sud >= nord || ouest >= est) return undefined;
  return { nord, sud, ouest, est };
}

/** Un instant ISO 8601 avec fuseau (?du=2026-10-09T16:00:00Z) ; null s'il manque, undefined s'il ne va pas */
function lireInstant(brut: unknown): Date | null | undefined {
  if (brut === undefined) return null;
  if (typeof brut !== "string" || !FORME_INSTANT.test(brut)) return undefined;
  const date = new Date(brut);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Visible dans l'app : lieu publié et vérifié, pas suspendu par la modération (l'annulation se regarde à part) */
const estVisible = (e: EvenementAvecLieu) => e.lieu.publie && e.lieu.verifie && !e.suspendu;

export function creerControleursEvenementsApp({ services, chiffrement }: DependancesEvenementsApp, horloge: () => number) {
  const maintenant = () => new Date(horloge());

  /** 18 ans et plus (sans date gardée : compte du site, 18 ans ; compte inconnu ou date illisible : non, par prudence) */
  async function estMajeur(compteId: number, instant: Date): Promise<boolean> {
    const naissance = await services.lireNaissanceChiffree(compteId);
    return naissance !== undefined && estMajeurVisiteur(naissance, chiffrement, instant);
  }

  /** « Ça m'intéresse » : les événements visibles pas encore finis (annulés compris, montrés « Annulé »), le plus proche d'abord */
  async function lireMesInterets(compteId: number, instant: Date): Promise<MonInteretEvenement[]> {
    const [interets, majeur] = await Promise.all([services.listerInterets(compteId, instant), estMajeur(compteId, instant)]);
    return interets
      .flatMap(({ evenement, rappel }): MonInteretEvenement[] => {
        const prochaine = estVisible(evenement) ? calculerProchaineOccurrence(evenement, instant) : null;
        if (!prochaine) return [];
        const presente = presenterEvenementPublic(evenement, prochaine);
        return presente.alcool && !majeur ? [] : [{ evenement: presente, rappel, annule: evenement.annuleLe !== null }];
      })
      .sort((a, b) => a.evenement.debut.localeCompare(b.evenement.debut) || a.evenement.id - b.evenement.id);
  }

  const repondreInterets = async (reponse: Response, compteId: number) =>
    reponse.json({ ok: true, interets: await lireMesInterets(compteId, maintenant()) });

  return {
    /** GET /app/evenements[?nord&sud&ouest&est][&du&au] */
    async lister(requete: Request, reponse: Response) {
      const zone = lireZone(requete.query);
      if (zone === undefined) return champInvalide(reponse, "zone");
      const [du, au] = [lireInstant(requete.query.du), lireInstant(requete.query.au)];
      if (du === undefined || au === undefined) return champInvalide(reponse, "periode");
      const instant = maintenant();
      const debut = du ?? instant;
      const fin = au ?? new Date(debut.getTime() + PERIODE_EVENEMENTS_MAX_MS);
      if (fin <= debut || fin.getTime() - debut.getTime() > PERIODE_EVENEMENTS_MAX_MS) return champInvalide(reponse, "periode");
      const lignes = await services.listerVisibles({ zone, lieuId: null, du: debut, au: fin });
      reponse.set("Cache-Control", "public, max-age=60").json({ ok: true, evenements: listerDatesVisibles(lignes, debut, fin, instant, EVENEMENTS_PAR_LECTURE) });
    },

    /** GET /app/evenements/lieux/:lieuId */
    async listerDuLieu(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.lieuId);
      const lieu = lieuId === null ? null : await services.lireLieu(lieuId);
      if (!lieu?.publie) return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });
      const instant = maintenant();
      // Toutes les dates à venir : aucune n'est à plus de 3 mois de sa publication
      const au = new Date(instant.getTime() + HORIZON_EVENEMENT_MS + JOUR_MS);
      const lignes = await services.listerVisibles({ zone: null, lieuId: lieu.id, du: instant, au });
      reponse.set("Cache-Control", "public, max-age=60").json({ ok: true, evenements: listerDatesVisibles(lignes, instant, au, instant, EVENEMENTS_PAR_LIEU) });
    },

    /** GET /app/evenements/mes-interets */
    async listerMesInterets(_requete: Request, reponse: Response) {
      await repondreInterets(reponse, lireCompteId(reponse));
    },

    /** PUT /app/evenements/:id/interet { rappel? } */
    async poserInteret(requete: Request, reponse: Response) {
      const compteId = lireCompteId(reponse);
      const id = lireIdentifiant(requete.params.id);
      if (id === null) return champInvalide(reponse, "id");
      const rappel = lireCorps(requete).rappel;
      if (rappel !== undefined && typeof rappel !== "boolean") return champInvalide(reponse, "rappel");
      const instant = maintenant();
      const evenement = await services.lireAvecLieu(id);
      if (!evenement || !estVisible(evenement) || evenement.annuleLe !== null) return reponse.status(404).json({ ok: false, erreur: "evenement-inconnu" });
      if (estEvenementAlcool(evenement, evenement.lieu.type) && !(await estMajeur(compteId, instant))) {
        return reponse.status(403).json({ ok: false, erreur: "mineur-alcool" });
      }
      if (!calculerProchaineOccurrence(evenement, instant)) return reponse.status(409).json({ ok: false, erreur: "evenement-passe" });
      await services.poserInteret(compteId, id, rappel === true);
      await repondreInterets(reponse, compteId);
    },

    /** DELETE /app/evenements/:id/interet (rien à retirer : 200, rien ne change) */
    async retirerInteret(requete: Request, reponse: Response) {
      const compteId = lireCompteId(reponse);
      const id = lireIdentifiant(requete.params.id);
      if (id === null) return champInvalide(reponse, "id");
      await services.retirerInteret(compteId, id);
      await repondreInterets(reponse, compteId);
    },
  };
}
