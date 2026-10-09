// Statistiques d'un lieu dans la base : seulement lire (vues_lieux, rescousses, visites). Les visites et les premières visites
// passent par l'index (lieu_id, statut) des visites ; le rangement par semaine est fait au-dessus.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { ServicesStatistiquesLieu } from "./statistiques-lieu-regles.ts";

/** Un jour « AAAA-MM-JJ » tel que Prisma l'attend pour une colonne DATE (minuit UTC, la session de la base est en UTC) */
const versDate = (jour: string) => new Date(`${jour}T00:00:00Z`);

export function creerStatistiquesLieu(): ServicesStatistiquesLieu {
  return {
    async listerVues(lieuId, du, au) {
      const lignes = await baseDeDonnees.vueLieu.findMany({
        where: { lieuId, jour: { gte: versDate(du), lte: versDate(au) } },
        select: { jour: true, nombre: true },
      });
      return lignes.map((l) => ({ jour: l.jour.toISOString().slice(0, 10), nombre: l.nombre }));
    },

    async compterRescousses(lieuId, semaines) {
      const groupes = await baseDeDonnees.rescousse.groupBy({ by: ["semaine"], where: { lieuId, semaine: { in: semaines } }, _count: { _all: true } });
      return groupes.map((g) => ({ semaine: g.semaine, nombre: g._count._all }));
    },

    async listerValidations(lieuId, depuis) {
      const visites = await baseDeDonnees.visite.findMany({ where: { lieuId, statut: "validee", valideLe: { gte: depuis } }, select: { valideLe: true } });
      return visites.flatMap((v) => (v.valideLe ? [v.valideLe] : []));
    },

    async listerPremieresValidations(lieuId, depuis) {
      // La première visite validée de chaque client ici, seulement quand elle tombe après `depuis`
      const groupes = await baseDeDonnees.visite.groupBy({
        by: ["compteId"],
        where: { lieuId, statut: "validee", valideLe: { not: null } },
        _min: { valideLe: true },
        having: { valideLe: { _min: { gte: depuis } } },
      });
      return groupes.flatMap((g) => (g._min.valideLe ? [g._min.valideLe] : []));
    },
  };
}
