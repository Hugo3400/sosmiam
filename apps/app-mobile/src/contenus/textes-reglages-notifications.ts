import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_NOTIFICATIONS_ANGLAIS } from "~/contenus/anglais/textes-reglages-notifications";

export const TEXTES_REGLAGES_NOTIFICATIONS = {
  minuit: "minuit",
  introduction:
    "Les SOS et les événements arrivent sur ton téléphone ; les offres des lieux, seulement si tu les allumes. Tes abonnés et tes demandes t'attendent aussi derrière la cloche du fil.",
  echec: "Oups, ce choix n'a pas pu être gardé sur ton téléphone. Réessaie un peu plus tard.",
  offresEnAttente: "📮 Ton choix pour les offres part dès que le réseau revient.",
  chutEnAttente: "📮 Ton « chut » part dès que le réseau revient.",
  titre: "Notifications",
  sousTitre: "Choisis ce qui mérite de faire vibrer ta poche.",
  chargement: "Chargement de tes réglages",
  recevoir: "Recevoir des notifications",
  recevoirDetail: "Tu peux tout couper d'un coup, sans rancune",
  interesse: "Ce qui t'intéresse",
  toutCoupe: "Tout est coupé pour l'instant : rallume les notifications juste au-dessus pour choisir lesquelles tu veux.",
  abonnements: "Tes abonnements",
  nuit: "La nuit",
  modeNuit: "Mode nuit",
  modeNuitDetail: "Pas de notification pendant que tu dors",
  aPartirDe: "À partir de",
  debutLu: "Début du mode nuit",
  jusqua: "Jusqu'à",
  finLu: "Fin du mode nuit",
  resume: (de: string, a: string) => `De ${de} à ${a}, ton téléphone reste tranquille.`,
} as const;

export const TEXTES_REGLAGES_NOTIFICATIONS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_NOTIFICATIONS>> = {
  fr: TEXTES_REGLAGES_NOTIFICATIONS,
  en: TEXTES_REGLAGES_NOTIFICATIONS_ANGLAIS,
};
