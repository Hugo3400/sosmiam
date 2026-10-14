import type { CibleCloche, NotificationClocheApi, TypeCloche } from "../../../../../packages/commun/src/types/cloche.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";

/** Une ligne de notifications_cloche (le texte est écrit par l'app : ici, le type, qui agit et sur quoi) */
export type LigneNotificationCloche = {
  id: number;
  type: string;
  cible: string | null;
  cibleId: string | null;
  detail: string | null;
  enRetour: boolean;
  creeLe: Date;
};

/** Une notification de la cloche telle que l'app la lit ; acteur null : l'équipe SOS Miam (décisions de la modération) */
export function presenterNotificationCloche(ligne: LigneNotificationCloche, acteur: PersonneResume | null): NotificationClocheApi {
  return {
    id: String(ligne.id),
    type: ligne.type as TypeCloche,
    acteur,
    date: ligne.creeLe.toISOString(),
    cible: ligne.cible && ligne.cibleId ? { type: ligne.cible as CibleCloche, id: ligne.cibleId } : null,
    detail: ligne.detail,
    enRetour: ligne.enRetour,
  };
}
