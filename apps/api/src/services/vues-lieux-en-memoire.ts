// Double en mémoire des vues des fiches, pour les tests (aucune base de données). Les compteurs (`vues`) peuvent être partagés
// avec le double des statistiques (statistiques-lieu-en-memoire.ts), pour retrouver une vue comptée dans les chiffres du lieu.
import type { ServicesVuesLieux } from "./vues-lieux-regles.ts";

/** Une ligne de vues_lieux : le compteur d'un lieu pour un jour de Paris (« AAAA-MM-JJ ») */
export type LigneVueEnMemoire = { lieuId: number; jour: string; nombre: number };

export function creerVuesLieuxEnMemoire(vues: LigneVueEnMemoire[] = []) {
  /** Les lieux publiés (les autres sont inconnus, brouillons ou masqués) */
  const publies = new Set<number>();

  const services: ServicesVuesLieux = {
    async ajouterVue(lieuId, jour) {
      if (!publies.has(lieuId)) return false;
      const ligne = vues.find((v) => v.lieuId === lieuId && v.jour === jour);
      if (ligne) ligne.nombre += 1;
      else vues.push({ lieuId, jour, nombre: 1 });
      return true;
    },
  };
  /** Le compteur d'un lieu pour un jour (0 sans ligne) */
  const lire = (lieuId: number, jour: string) => vues.find((v) => v.lieuId === lieuId && v.jour === jour)?.nombre ?? 0;
  return { services, publies, vues, lire };
}
