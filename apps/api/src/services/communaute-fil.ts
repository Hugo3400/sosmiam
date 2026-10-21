import { JOURS_FIL_MIAMIS, MAX_EVENEMENTS_FIL_MIAMIS } from "../../../../packages/commun/src/regles/communaute.ts";
import type { EvenementMiamis } from "../../../../packages/commun/src/types/qui-est-la.ts";
import { normaliserVilleCle } from "../fonctions/communaute/normaliser-ville-cle.ts";
import type { ContexteCommunaute } from "./communaute-regles.ts";
import type { LectureSortiesMiamis } from "./communaute-sorties-lecture.ts";

type Brouillon = Omit<EvenementMiamis, "auteur" | "date"> & { auteurId: number | null; date: Date; parAuteur?: boolean };

export function creerFil(c: ContexteCommunaute, lecture: LectureSortiesMiamis) {
  return {
    async lire(moi: number, maintenant: Date): Promise<EvenementMiamis[]> {
      return c.depot.lire(async (t) => {
        const villeCle = normaliserVilleCle((await t.lireComptes([moi])).get(moi)?.ville);
        const depuis = new Date(maintenant.getTime() - JOURS_FIL_MIAMIS * 24 * 3_600_000);
        const [activite, blocages] = await Promise.all([t.lireActiviteRecente(villeCle, depuis, MAX_EVENEMENTS_FIL_MIAMIS * 3), c.relations.listerBlocages(moi)]);
        const aVenir = activite.sorties.filter((l) => l.quand > maintenant);
        const visibles = new Map((await lecture.filtrerVisibles(t, moi, await lecture.lireAvecParticipations(t, aVenir), maintenant)).map((l) => [l.ligne.id, l.ligne]));
        const brouillons: Brouillon[] = [
          ...activite.idees.map((i) => ({ id: `idee:${i.id}`, auteurId: i.auteurId, type: "idee-proposee" as const, titre: i.titre, nombre: 0, date: i.publieeLe })),
          ...activite.reponses.map((r) => ({ id: `reponse:${r.id}`, auteurId: null, type: "reponse-brigade" as const, titre: r.titre, nombre: 0, date: r.reponduLe })),
          ...activite.votes.map((v) => ({ id: "votes", parAuteur: true, auteurId: v.compteId, type: "votes-idees" as const, titre: "", nombre: v.nombre, date: v.dernier })),
          ...[...visibles.values()].filter((l) => l.creeLe >= depuis).map((l) => ({
            id: `sortie:${l.id}`, auteurId: l.organisateurId, type: "sortie-organisee" as const, titre: l.titre, nombre: 0, date: l.creeLe,
          })),
          ...activite.arrivees.flatMap((a) => {
            const sortie = visibles.get(a.sortieId);
            return sortie ? [{ id: `arrivee:${a.sortieId}`, parAuteur: true, auteurId: a.compteId, type: "sortie-rejointe" as const, titre: sortie.titre, nombre: 0, date: a.decideLe }] : [];
          }),
        ].filter((b) => b.auteurId === null || !blocages.caches.has(b.auteurId));
        const personnes = await c.relations.presenter([...new Set(brouillons.flatMap((b) => (b.auteurId !== null ? [b.auteurId] : [])))]);
        return brouillons
          .filter((b) => b.auteurId === null || b.type === "idee-proposee" || personnes.has(b.auteurId))
          .map(({ parAuteur, ...b }) => ({ ...b, id: parAuteur && b.auteurId !== null ? `${b.id}:${personnes.get(b.auteurId)?.id}` : b.id }))
          .sort((a, b) => b.date.getTime() - a.date.getTime() || a.id.localeCompare(b.id))
          .slice(0, MAX_EVENEMENTS_FIL_MIAMIS)
          .map(({ auteurId, date, ...reste }) => ({ ...reste, auteur: auteurId !== null ? (personnes.get(auteurId) ?? null) : null, date: date.toISOString() }));
      });
    },
  };
}
