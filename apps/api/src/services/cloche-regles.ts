// La cloche de l'app : les notifications DANS l'app (spécification sociale B.9, D.2), contrat commun du service Prisma
// (cloche.ts) et de son double en mémoire (cloche-en-memoire.ts). Le texte est écrit par l'app : ici, seulement le type,
// qui agit et sur quoi. noter sert aussi à la session Logiciel (décisions de la modération : « contenu-retire »,
// « signalement-decide », acteur null). 90 jours, 200 au plus par compte (le ménage de nuit, lot L7) ; les trois types de
// la modération 6 mois, hors de cette limite.
import type { PageClocheApi } from "../../../../packages/commun/src/types/cloche.ts";
import type { NouvelleNotificationCloche } from "./effets-sociaux-regles.ts";

export interface ServicesCloche {
  /**
   * Écrit ces notifications. Rien s'il y a un blocage entre le destinataire et l'acteur (dans un sens ou dans l'autre), ni
   * si l'acteur est le destinataire. Dédoublonnage : même destinataire, même type, même acteur et même cible depuis moins
   * de 24 h, la notification déjà là est seulement remise à la date du jour (elle redevient « pas vue »).
   */
  noter(notifications: readonly NouvelleNotificationCloche[], maintenant: Date): Promise<void>;
  /** 30 par page, la plus récente d'abord, sans celles d'une personne avec qui il y a un blocage ; apres : la `suite` d'avant */
  lister(compteId: number, apres: string | null): Promise<PageClocheApi>;
  /**
   * « Vu jusqu'à » : ne recule jamais, ni ne dépasse maintenant ; le même sur tous les téléphones du compte (gardé dans son
   * profil social). SANS PROFIL SOCIAL (Potes jamais ouvert, mais une décision de la modération reçue), rien n'est gardé sur
   * le serveur, car aucune lecture ne crée le profil : la date (bornée) est rendue telle quelle, pour que l'app la garde sur
   * le téléphone ; lister rend alors vuesLe: null et le pouls cloche.nonVues: 0 (l'app compte elle-même les notifications
   * plus récentes que sa date). Choix provisoire, sans migration, à confirmer par Hugo (autre piste : une colonne
   * cloche_vue_le sur comptes).
   */
  marquerVu(compteId: number, jusqua: Date, maintenant: Date): Promise<Date>;
  effacer(compteId: number, id: number): Promise<boolean>;
  effacerLues(compteId: number, jusqua: Date | null, maintenant: Date): Promise<number>;
}

/** Notifications par page de GET /app/cloche */
export const NOTIFICATIONS_PAR_PAGE = 30;
/** Une même notification (type, acteur, cible) moins de 24 h après la précédente : la date de la première est remise à jour */
export const FENETRE_DOUBLON_CLOCHE_MS = 24 * 60 * 60 * 1000;
/** Colonne detail (VarChar(120)) */
export const LONGUEUR_MAX_DETAIL_CLOCHE = 120;
