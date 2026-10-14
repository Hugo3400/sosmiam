// La cloche dans la base (contrat dans cloche-regles.ts). Aussi pour la session Logiciel : creerCloche().noter(…) écrit les
// décisions de la modération (acteur null). Jamais de texte de message ni de titre de groupe ici.
import { lireCurseurDate } from "../fonctions/social/lire-curseur-date.ts";
import { ecrireCurseurDate } from "../fonctions/social/ecrire-curseur-date.ts";
import { presenterNotificationCloche } from "../fonctions/social/presenter-notification-cloche.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { FENETRE_DOUBLON_CLOCHE_MS, LONGUEUR_MAX_DETAIL_CLOCHE, NOTIFICATIONS_PAR_PAGE, type ServicesCloche } from "./cloche-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import { creerRelationsSociales } from "./relations-sociales.ts";

export function creerCloche(relations: RelationsSociales = creerRelationsSociales(), base = baseDeDonnees): ServicesCloche {
  return {
    async noter(notifications, maintenant) {
      for (const n of notifications) {
        if (n.acteurId !== null && (n.acteurId === n.compteId || (await relations.bloqueEntre(n.compteId, n.acteurId)))) continue;
        const detail = n.detail ? n.detail.slice(0, LONGUEUR_MAX_DETAIL_CLOCHE) : null;
        const cible = n.cible?.type ?? null;
        const cibleId = n.cible?.id ?? null;
        const deja = await base.notificationCloche.findFirst({
          where: {
            compteId: n.compteId, type: n.type, acteurId: n.acteurId, cible, cibleId,
            creeLe: { gte: new Date(maintenant.getTime() - FENETRE_DOUBLON_CLOCHE_MS) },
          },
          select: { id: true },
          orderBy: { id: "desc" },
        });
        if (deja) {
          await base.notificationCloche.update({ where: { id: deja.id }, data: { creeLe: maintenant, detail, enRetour: n.enRetour ?? false } });
          continue;
        }
        await base.notificationCloche.create({
          data: { compteId: n.compteId, type: n.type, acteurId: n.acteurId, cible, cibleId, detail, enRetour: n.enRetour ?? false, creeLe: maintenant },
        });
      }
    },

    async lister(compteId, apres) {
      const curseur = lireCurseurDate(apres) ?? null;
      const [{ caches }, profil] = await Promise.all([
        relations.listerBlocages(compteId),
        base.profilSocial.findUnique({ where: { compteId }, select: { clocheVueLe: true } }),
      ]);
      const filtres: Prisma.NotificationClocheWhereInput[] = [{ compteId }];
      if (caches.size > 0) filtres.push({ OR: [{ acteurId: null }, { acteurId: { notIn: [...caches] } }] });
      if (curseur) filtres.push({ OR: [{ creeLe: { lt: curseur.date } }, { creeLe: curseur.date, id: { lt: curseur.id } }] });
      const lignes = await base.notificationCloche.findMany({
        where: { AND: filtres },
        select: { id: true, type: true, acteurId: true, cible: true, cibleId: true, detail: true, enRetour: true, creeLe: true },
        orderBy: [{ creeLe: "desc" }, { id: "desc" }],
        take: NOTIFICATIONS_PAR_PAGE + 1,
      });
      const page = lignes.slice(0, NOTIFICATIONS_PAR_PAGE);
      const personnes = await relations.presenter(page.flatMap((l) => (l.acteurId === null ? [] : [l.acteurId])));
      const notifications = page.flatMap((l) => {
        if (l.acteurId === null) return [presenterNotificationCloche(l, null)];
        // Un acteur sans profil social ne se montre jamais (et jamais comme « l'équipe »)
        const acteur = personnes.get(l.acteurId);
        return acteur ? [presenterNotificationCloche(l, acteur)] : [];
      });
      const derniere = page.at(-1);
      return {
        notifications,
        vuesLe: profil?.clocheVueLe?.toISOString() ?? null,
        suite: lignes.length > NOTIFICATIONS_PAR_PAGE && derniere ? ecrireCurseurDate(derniere.creeLe, derniere.id) : null,
      };
    },

    async marquerVu(compteId, jusqua, maintenant) {
      const borne = jusqua.getTime() > maintenant.getTime() ? maintenant : jusqua;
      // Une seule écriture, sans course entre deux téléphones : la plus tardive des deux dates reste
      const lignes = await base.$queryRaw<{ vue: Date }[]>`
        UPDATE profils_sociaux SET cloche_vue_le = GREATEST(COALESCE(cloche_vue_le, ${borne}::timestamptz), ${borne}::timestamptz)
        WHERE compte_id = ${compteId} RETURNING cloche_vue_le AS vue`;
      return lignes[0]?.vue ?? borne;
    },
  };
}
