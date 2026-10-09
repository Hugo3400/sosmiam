// Prévention alcool, la même partout : site (pied de page, fiches, page /prevention) et app (fiches, carte, publications,
// offres). Décidé par Hugo le 9 octobre 2026 (docs/decisions.md, « Santé et prévention »). Le message sanitaire de la loi Évin
// est une formule imposée : on l'écrit mot pour mot, sans la mettre au tutoiement. Numéros et sites : services publics d'aide
// (Santé publique France) ; ne pas en ajouter sans vérifier qu'ils existent.

/** Formule imposée par la loi Évin, reprise telle quelle partout où l'alcool est évoqué */
export const MESSAGE_SANITAIRE_ALCOOL = "L'abus d'alcool est dangereux pour la santé, à consommer avec modération.";

/** Le service d'aide sur l'alcool : appel anonyme et non surtaxé, 7 jours sur 7 */
export const ALCOOL_INFO_SERVICE = {
  nom: "Alcool Info Service",
  telephone: "0 980 980 930",
  lienTelephone: "tel:+33980980930",
  site: "https://www.alcool-info-service.fr",
} as const;

/** La page de prévention du site (alcool, route, manger-bouger) */
export const ADRESSE_PAGE_PREVENTION = "https://sosmiam.fr/prevention";
