// Double en mémoire de la cloche (contrat dans cloche-regles.ts), posé sur les tables partagées.
import { ecrireCurseurDate } from "../fonctions/social/ecrire-curseur-date.ts";
import { lireCurseurDate } from "../fonctions/social/lire-curseur-date.ts";
import { presenterNotificationCloche } from "../fonctions/social/presenter-notification-cloche.ts";
import { FENETRE_DOUBLON_CLOCHE_MS, LONGUEUR_MAX_DETAIL_CLOCHE, NOTIFICATIONS_PAR_PAGE, type ServicesCloche } from "./cloche-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { bloquesEnMemoire, prendreId, type TablesSociales } from "./tables-sociales-en-memoire.ts";

/** Plus récente d'abord ; à la même milliseconde, la plus grande id d'abord */
const parDate = (a: { creeLe: Date; id: number }, b: { creeLe: Date; id: number }) => b.creeLe.getTime() - a.creeLe.getTime() || b.id - a.id;

export function creerClocheEnMemoire(tables: TablesSociales, relations: RelationsSociales): ServicesCloche {
  return {
    async noter(notifications, maintenant) {
      for (const n of notifications) {
        if (n.acteurId !== null && (n.acteurId === n.compteId || bloquesEnMemoire(tables, n.compteId, n.acteurId))) continue;
        const detail = n.detail ? n.detail.slice(0, LONGUEUR_MAX_DETAIL_CLOCHE) : null;
        const cible = n.cible?.type ?? null;
        const cibleId = n.cible?.id ?? null;
        const depuis = maintenant.getTime() - FENETRE_DOUBLON_CLOCHE_MS;
        const deja = [...tables.cloche.values()]
          .filter((l) => l.compteId === n.compteId && l.type === n.type && l.acteurId === n.acteurId && l.cible === cible && l.cibleId === cibleId)
          .filter((l) => l.creeLe.getTime() >= depuis)
          .sort((a, b) => b.id - a.id)[0];
        if (deja) {
          Object.assign(deja, { creeLe: maintenant, detail, enRetour: n.enRetour ?? false });
          continue;
        }
        const id = prendreId(tables, "cloche");
        tables.cloche.set(id, { id, compteId: n.compteId, type: n.type, acteurId: n.acteurId, cible, cibleId, detail, enRetour: n.enRetour ?? false, creeLe: maintenant });
      }
    },

    async lister(compteId, apres) {
      const curseur = lireCurseurDate(apres) ?? null;
      const { caches } = await relations.listerBlocages(compteId);
      const lignes = [...tables.cloche.values()]
        .filter((l) => l.compteId === compteId && (l.acteurId === null || !caches.has(l.acteurId)))
        .filter((l) => !curseur || parDate(l, { creeLe: curseur.date, id: curseur.id }) > 0)
        .sort(parDate);
      const page = lignes.slice(0, NOTIFICATIONS_PAR_PAGE);
      const personnes = await relations.presenter(page.flatMap((l) => (l.acteurId === null ? [] : [l.acteurId])));
      const notifications = page.flatMap((l) => {
        if (l.acteurId === null) return [presenterNotificationCloche(l, null)];
        const acteur = personnes.get(l.acteurId);
        return acteur ? [presenterNotificationCloche(l, acteur)] : [];
      });
      const derniere = page.at(-1);
      return {
        notifications,
        vuesLe: tables.profils.get(compteId)?.clocheVueLe?.toISOString() ?? null,
        suite: lignes.length > NOTIFICATIONS_PAR_PAGE && derniere ? ecrireCurseurDate(derniere.creeLe, derniere.id) : null,
      };
    },

    async marquerVu(compteId, jusqua, maintenant) {
      const borne = jusqua.getTime() > maintenant.getTime() ? maintenant : jusqua;
      const profil = tables.profils.get(compteId);
      if (!profil) return borne;
      if (!profil.clocheVueLe || profil.clocheVueLe.getTime() < borne.getTime()) profil.clocheVueLe = new Date(borne.getTime());
      return profil.clocheVueLe;
    },
  };
}
