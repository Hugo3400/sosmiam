import type { StatutAvis } from "../../../../packages/commun/src/types/avis.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { CitationsPhotosAvis } from "./photos-avis-regles.ts";

export const citationsPhotosAvis: CitationsPhotosAvis = {
  async lister(photos) {
    const noms = [...new Set(photos)];
    if (noms.length === 0) return [];
    const lignes = await baseDeDonnees.avis.findMany({
      where: { photo: { in: noms } },
      select: { id: true, photo: true, statut: true, creeLe: true, lieu: { select: { statut: true } } },
    });
    return lignes.map((l) => ({
      photo: l.photo!, avisId: l.id, statut: l.statut as StatutAvis, lieuPublie: l.lieu.statut === "publie", creeLe: l.creeLe,
    }));
  },

  async listerDecisions(avisIds) {
    const ids = [...new Set(avisIds)];
    if (ids.length === 0) return [];
    const lignes = await baseDeDonnees.signalement.findMany({
      where: { cible: "avis", cibleId: { in: ids.map(String) } },
      select: { cibleId: true, statut: true, contesteLe: true, reexamineLe: true, traiteLe: true },
    });
    return lignes.map(({ cibleId, ...d }) => ({ ...d, avisId: Number(cibleId) }));
  },
};
