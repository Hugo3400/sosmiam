// Double en mémoire de l'activité de l'app, pour les tests (aucune base de données).
import { JOURS_LIEU_NOUVEAU } from "../../../../packages/commun/src/regles/lieux-nouveaux.ts";
import { RESCOUSSES_PAR_SEMAINE } from "../../../../packages/commun/src/regles/rescousses.ts";
import { calculerClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";
import type { ServicesActivite } from "./activite-regles.ts";

/** Un lieu connu des tests : publié ? vérifié ? première mise en ligne ? */
export type LieuActiviteEnMemoire = { publie: boolean; verifie: boolean; publieLe: Date | null };

const JOUR_MS = 24 * 60 * 60 * 1000;

export function creerActiviteEnMemoire() {
  const lieux = new Map<number, LieuActiviteEnMemoire>();
  const publications = new Set<number>();
  const rescousses: { compteId: number; lieuId: number; semaine: string; creeLe: Date }[] = [];
  const premiers = new Map<number, number | null>();
  const gardes: { compteId: number; lieuId: number; le: number }[] = [];
  const jaimes: { compteId: number; publicationId: number; le: number }[] = [];
  const masques: { compteId: number; publicationId: number }[] = [];
  const suivis: { compteId: number; cle: string; le: number }[] = [];
  let horlogeInterne = 0;

  const services: ServicesActivite = {
    async lireActivite(compteId, maintenant) {
      const { semaine, mois } = calculerClesPeriodes(maintenant);
      const miennes = rescousses.filter((r) => r.compteId === compteId).sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime());
      const cetteSemaine = miennes.filter((r) => r.semaine === semaine).map((r) => r.lieuId);
      const parDate = <T extends { le: number }>(l: T[]) => [...l].sort((a, b) => b.le - a.le);
      return {
        semaine,
        restantes: Math.max(0, RESCOUSSES_PAR_SEMAINE - cetteSemaine.length),
        rescoussesSemaine: cetteSemaine,
        lieuxSauves: [...new Set(miennes.map((r) => r.lieuId))],
        rescoussesDonnees: miennes.length,
        rescoussesDuMois: miennes.filter((r) => calculerClesPeriodes(r.creeLe).mois === mois).length,
        premiersSauvetages: [...premiers].filter(([, c]) => c === compteId).map(([l]) => l),
        gardes: parDate(gardes.filter((g) => g.compteId === compteId)).map((g) => g.lieuId),
        jaimes: parDate(jaimes.filter((j) => j.compteId === compteId)).map((j) => String(j.publicationId)),
        masques: masques.filter((m) => m.compteId === compteId).map((m) => String(m.publicationId)),
        suivis: parDate(suivis.filter((s) => s.compteId === compteId)).map((s) => s.cle),
      };
    },

    async donnerRescousse(compteId, lieuId, maintenant) {
      const lieu = lieux.get(lieuId);
      if (!lieu || !lieu.publie) return { ok: false, erreur: "lieu-inconnu" };
      if (!lieu.verifie) return { ok: false, erreur: "lieu-non-verifie" };
      const { semaine } = calculerClesPeriodes(maintenant);
      if (rescousses.some((r) => r.compteId === compteId && r.lieuId === lieuId && r.semaine === semaine)) return { ok: true, deja: true, premierSauveteur: false };
      if (rescousses.filter((r) => r.compteId === compteId && r.semaine === semaine).length >= RESCOUSSES_PAR_SEMAINE) return { ok: false, erreur: "plus-de-rescousse" };
      rescousses.push({ compteId, lieuId, semaine, creeLe: maintenant });
      const nouveau = lieu.publieLe !== null && maintenant.getTime() - lieu.publieLe.getTime() < JOURS_LIEU_NOUVEAU * JOUR_MS;
      const premier = nouveau && !premiers.has(lieuId);
      if (premier) premiers.set(lieuId, compteId);
      return { ok: true, deja: false, premierSauveteur: premier };
    },

    async reprendreRescousse(compteId, lieuId, maintenant) {
      const { semaine } = calculerClesPeriodes(maintenant);
      const i = rescousses.findIndex((r) => r.compteId === compteId && r.lieuId === lieuId && r.semaine === semaine);
      if (i < 0) return { ok: true, reprise: false, premierSauveteurRetire: false };
      rescousses.splice(i, 1);
      const encore = rescousses.some((r) => r.compteId === compteId && r.lieuId === lieuId);
      const retire = !encore && premiers.get(lieuId) === compteId;
      if (retire) premiers.delete(lieuId);
      return { ok: true, reprise: true, premierSauveteurRetire: retire };
    },

    async basculer(compteId, geste, oui) {
      const le = ++horlogeInterne;
      if (geste.quoi === "garde" || geste.quoi === "suivi-lieu") {
        if (oui && !lieux.get(geste.lieuId)?.publie) return { ok: false, erreur: "lieu-inconnu" };
        if (geste.quoi === "garde") {
          const i = gardes.findIndex((g) => g.compteId === compteId && g.lieuId === geste.lieuId);
          if (oui && i < 0) gardes.push({ compteId, lieuId: geste.lieuId, le });
          if (!oui && i >= 0) gardes.splice(i, 1);
        } else basculerSuivi(compteId, `lieu:${geste.lieuId}`, oui, le);
        return { ok: true };
      }
      if (geste.quoi === "suivi-createur") {
        basculerSuivi(compteId, `createur:${geste.pseudo}`, oui, le);
        return { ok: true };
      }
      if (oui && !publications.has(geste.publicationId)) return { ok: false, erreur: "publication-inconnue" };
      const liste: { compteId: number; publicationId: number; le?: number }[] = geste.quoi === "jaime" ? jaimes : masques;
      const i = liste.findIndex((x) => x.compteId === compteId && x.publicationId === geste.publicationId);
      if (oui && i < 0) liste.push({ compteId, publicationId: geste.publicationId, le });
      if (!oui && i >= 0) liste.splice(i, 1);
      return { ok: true };
    },
  };

  function basculerSuivi(compteId: number, cle: string, oui: boolean, le: number) {
    const i = suivis.findIndex((s) => s.compteId === compteId && s.cle === cle);
    if (oui && i < 0) suivis.push({ compteId, cle, le });
    if (!oui && i >= 0) suivis.splice(i, 1);
  }

  return { services, lieux, publications, rescousses, premiers };
}
