// Les services sociaux de l'app (compte connecté), en version API seulement : la démo garde son code local, et une visite
// sans compte n'a rien (valeurs vides). FournisseurSession les crée avec creerServicesSociauxApi, à côté des autres services.
// Un champ par domaine : chaque lot ajoute le sien à la fin (bande et suivis entre personnes en L3, messagerie en L4,
// sorties et listes en L5, commentaires, signalements sociaux et décisions de la modération en L6).

import type { ServiceCloche } from "./contrat-cloche.ts";
import type { ServiceSocial } from "./contrat-social.ts";

export type ServicesSociaux = {
  /** Profil social, pouls, personnes et masques (/app/social, /app/personnes, /app/masques) */
  social: ServiceSocial;
  /** Notifications dans l'app (/app/cloche) */
  cloche: ServiceCloche;
};
