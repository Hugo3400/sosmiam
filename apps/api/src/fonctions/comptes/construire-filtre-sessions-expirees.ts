import { DUREES_SESSIONS } from "./est-session-expiree.ts";

/**
 * Filtre (forme Prisma) des sessions expirées à ce moment, selon leur support, pour le ménage de nuit : mêmes durées que
 * estSessionExpiree. Site (et toute ligne sans support « app ») : 30 jours sans visite, ou ouverte depuis plus de 90 jours ;
 * app : 1 an sans usage, sans limite totale.
 */
export function construireFiltreSessionsExpirees(maintenant: Date) {
  const avant = (duree: number) => new Date(maintenant.getTime() - duree);
  const { site, app } = DUREES_SESSIONS;
  return {
    OR: [
      { support: { not: "app" }, OR: [{ activite: { lt: avant(site.inactiviteMax) } }, { creeLe: { lt: avant(site.dureeMax) } }] },
      { support: "app", activite: { lt: avant(app.inactiviteMax) } },
    ],
  };
}
