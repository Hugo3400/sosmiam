// Double en mémoire des lieux lus par l'app, pour les tests (aucune base de données).
import type { CarteLieu } from "../../../../packages/commun/src/types/carte.ts";
import { presenterLieuApp, type LigneLieuApp } from "../fonctions/lieux/presenter-lieu-app.ts";
import { presenterCarte } from "../fonctions/pro/presenter-carte.ts";
import { LIEUX_PAR_LECTURE, type ServicesLieuxApp, type ZoneLieux } from "./lieux-app-regles.ts";

/** Un lieu de test : la ligne lue par l'app, plus son statut et sa carte */
export type LieuAppEnMemoire = LigneLieuApp & { statut: "brouillon" | "publie" | "masque"; carte: Omit<CarteLieu, "majLe"> | null; carteMajLe: Date | null };

export function creerLieuxAppEnMemoire() {
  const lieux = new Map<number, LieuAppEnMemoire>();
  const dansZone = (l: LieuAppEnMemoire, z: ZoneLieux | null) =>
    !z || (l.latitude !== null && l.longitude !== null && l.latitude >= z.sud && l.latitude <= z.nord && l.longitude >= z.ouest && l.longitude <= z.est);
  const publie = (id: number) => {
    const l = lieux.get(id);
    return l && l.statut === "publie" ? l : null;
  };

  const services: ServicesLieuxApp = {
    async listerLieux(zone, maintenant) {
      return [...lieux.values()]
        .filter((l) => l.statut === "publie" && dansZone(l, zone))
        .sort((a, b) => a.id - b.id)
        .slice(0, LIEUX_PAR_LECTURE)
        .map((l) => presenterLieuApp(l, maintenant));
    },
    async lireLieu(id, maintenant) {
      const l = publie(id);
      return l ? presenterLieuApp(l, maintenant) : null;
    },
    async lireCarte(id) {
      const l = publie(id);
      return l ? presenterCarte(l.carte, l.carteMajLe) : null;
    },
  };
  return { services, lieux };
}
