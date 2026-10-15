// Les services sociaux de l'app (compte connecté), en version API seulement : la démo garde son code local, et une visite
// sans compte n'a rien (valeurs vides). FournisseurSession les crée avec creerServicesSociauxApi, à côté des autres services.
// Un champ par domaine : chaque lot ajoute le sien à la fin (bande et suivis entre personnes en L3, messagerie en L4,
// sorties et listes en L5, commentaires, signalements sociaux et décisions de la modération en L6).

import type { ServiceCloche } from "./contrat-cloche.ts";
import type { ServiceSocial } from "./contrat-social.ts";
import type { ServiceBande } from "./contrat-bande.ts";
import type { ServiceSuivisPersonnes } from "./contrat-suivis-personnes.ts";
import type { ServiceMessagerie } from "./contrat-messagerie.ts";
import type { ServiceSorties } from "./contrat-sorties.ts";
import type { ServiceListes } from "./contrat-listes.ts";
import type { ServiceCommentaires } from "./contrat-commentaires.ts";
import type { ServiceModerationApp } from "./contrat-moderation-app.ts";
import type { ServiceSignalementsSociaux } from "./contrat-signalements-sociaux.ts";
import type { ServiceCommunaute } from "./contrat-communaute.ts";

export type ServicesSociaux = {
  /** Profil social, pouls, personnes et masques (/app/social, /app/personnes, /app/masques) */
  social: ServiceSocial;
  /** Notifications dans l'app (/app/cloche) */
  cloche: ServiceCloche;
  /** Bande, invitations, demandes, blocages, « Quoi de neuf » et classement (/app/bande, /app/blocages) */
  bande: ServiceBande;
  /** Suivis entre personnes (/app/suivis-personnes) */
  suivis: ServiceSuivisPersonnes;
  /** Messagerie, médias du chat et lieux envoyés (/app/conversations, /app/lieux-envoyes) */
  messagerie: ServiceMessagerie;
  /** Sorties entre potes (/app/sorties) */
  sorties: ServiceSorties;
  /** Listes de lieux (/app/listes) */
  listes: ServiceListes;
  /** Commentaires des publications (/app/commentaires ; la liste d'une publication se lit aussi sans compte) */
  commentaires: ServiceCommentaires;
  /** Signalements des contenus sociaux (/app/signalements) */
  signalements: ServiceSignalementsSociaux;
  /** Décisions de la modération et contestation (/app/moderation) */
  moderation: ServiceModerationApp;
  communaute: ServiceCommunaute;
};
