// Double en mémoire des statistiques d'un lieu, pour les tests (aucune base de données). Les compteurs de vues peuvent être
// ceux du double des vues (vues-lieux-en-memoire.ts) : une vue comptée par POST /app/lieux/:id/vue se retrouve ici.
import type { StatutVisite } from "../../../../packages/commun/src/types/visite.ts";
import type { ServicesStatistiquesLieu } from "./statistiques-lieu-regles.ts";
import type { LigneVueEnMemoire } from "./vues-lieux-en-memoire.ts";

export type RescousseEnMemoire = { compteId: number; lieuId: number; semaine: string };
export type VisiteStatistiqueEnMemoire = { compteId: number; lieuId: number; statut: StatutVisite; valideLe: Date | null };

export function creerStatistiquesLieuEnMemoire(vues: LigneVueEnMemoire[] = []) {
  const rescousses: RescousseEnMemoire[] = [];
  const visites: VisiteStatistiqueEnMemoire[] = [];
  const validees = (lieuId: number) => visites.filter((v) => v.lieuId === lieuId && v.statut === "validee" && v.valideLe !== null);

  const services: ServicesStatistiquesLieu = {
    async listerVues(lieuId, du, au) {
      return vues.filter((v) => v.lieuId === lieuId && v.jour >= du && v.jour <= au).map(({ jour, nombre }) => ({ jour, nombre }));
    },
    async compterRescousses(lieuId, semaines) {
      const parSemaine = new Map<string, number>();
      for (const r of rescousses) if (r.lieuId === lieuId && semaines.includes(r.semaine)) parSemaine.set(r.semaine, (parSemaine.get(r.semaine) ?? 0) + 1);
      return [...parSemaine].map(([semaine, nombre]) => ({ semaine, nombre }));
    },
    async listerValidations(lieuId, depuis) {
      return validees(lieuId).filter((v) => v.valideLe! >= depuis).map((v) => new Date(v.valideLe!));
    },
    async listerPremieresValidations(lieuId, depuis) {
      const premieres = new Map<number, Date>();
      for (const v of validees(lieuId)) {
        const connue = premieres.get(v.compteId);
        if (!connue || v.valideLe! < connue) premieres.set(v.compteId, v.valideLe!);
      }
      return [...premieres.values()].filter((d) => d >= depuis).map((d) => new Date(d));
    },
  };
  return { services, vues, rescousses, visites };
}
