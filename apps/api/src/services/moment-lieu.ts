// SOS « place ce soir » et message du moment dans la base. Le lancement passe par une transaction sous verrou de la ligne du
// lieu : deux membres de l'équipe qui touchent « Lancer » en même temps ne font jamais deux SOS le même jour.
import type { CreneauOuverture } from "../../../../packages/commun/src/types/lieu.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { ServicesMomentLieu } from "./moment-lieu-regles.ts";

export function creerMomentLieu(): ServicesMomentLieu {
  return {
    async lireLieu(lieuId) {
      const lieu = await baseDeDonnees.lieu.findUnique({ where: { id: lieuId }, select: { ouverture: true, alerte: true, alerteJusqua: true } });
      return lieu ? { ouverture: (Array.isArray(lieu.ouverture) ? lieu.ouverture : []) as CreneauOuverture[], alerte: lieu.alerte, alerteJusqua: lieu.alerteJusqua } : null;
    },

    async lireSosDepuis(lieuId, depuis) {
      const sos = await baseDeDonnees.sosLieu.findFirst({
        where: { lieuId, creeLe: { gte: depuis } },
        orderBy: { creeLe: "desc" },
        select: { places: true, offre: true, jusqua: true, creeLe: true, arreteLe: true, compte: { select: { prenom: true } } },
      });
      return sos ? { places: sos.places, offre: sos.offre, jusqua: sos.jusqua, creeLe: sos.creeLe, arreteLe: sos.arreteLe, lancePar: sos.compte?.prenom ?? null } : null;
    },

    async lancerSos(lieuId, compteId, sos, maintenant, depuis) {
      return baseDeDonnees.$transaction(async (transaction) => {
        await transaction.$queryRaw`SELECT id FROM lieux WHERE id = ${lieuId} FOR UPDATE`;
        if ((await transaction.sosLieu.count({ where: { lieuId, creeLe: { gte: depuis } } })) > 0) return "deja" as const;
        await transaction.sosLieu.create({ data: { lieuId, compteId, places: sos.places, offre: sos.offre, jusqua: sos.jusqua, creeLe: maintenant } });
        return "ok" as const;
      });
    },

    async arreterSos(lieuId, maintenant) {
      await baseDeDonnees.sosLieu.updateMany({ where: { lieuId, arreteLe: null, jusqua: { gt: maintenant } }, data: { arreteLe: maintenant } });
    },

    async reglerMessage(lieuId, message) {
      await baseDeDonnees.lieu.update({ where: { id: lieuId }, data: { alerte: message?.texte ?? null, alerteJusqua: message?.jusqua ?? null } });
    },
  };
}
