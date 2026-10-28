import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_MODERATION_ANGLAIS } from "~/contenus/anglais/textes-reglages-moderation";

export const TEXTES_REGLAGES_MODERATION = {
  titre: "Décisions de la modération",
  sousTitre: "Ce que l'équipe a décidé sur tes contenus et sur tes signalements, et pourquoi.",
  visiteTitre: "Ici, la modération te répond",
  visiteTexte:
    "C'est ici qu'arrivent les décisions de l'équipe sur tes contenus et sur tes signalements : la règle en cause, son explication, et de quoi contester pendant 6 mois. Pour ça, il te faut un compte.",
  creerCompte: "Créer mon compte",
  creerCompteIndice: "Ouvre la création de ton compte",
  chargementLu: "Les décisions arrivent",
  onRetente: "On retente…",
  onRassemble: "On rassemble les décisions…",
  rateesTitre: "Les décisions sont restées en cuisine",
  rateesTexte: "La connexion fait des siennes, rien de grave. Vérifie ton réseau, et on retente ?",
  reessayer: "Réessayer",
  reessayerIndice: "Relit les décisions de la modération",
  calmeTitre: "Tout est calme par ici",
  calmeTexte:
    "Aucune décision de la modération sur tes contenus ni sur tes signalements. Si l'équipe en prend une un jour, tu la trouveras ici, avec la règle en cause et son explication.",
  rafraichissementRate: "📡 Pas pu rafraîchir : tu vois les décisions d'avant.",
  limitationNonVerifiee: "📡 Pas pu vérifier si ton compte est limité : on retente ?",
  onRetenteLu: "On retente",
  discretion:
    "On ne te dit jamais qui a signalé, et la personne concernée ne saura jamais que c'est toi qui as signalé. Une contestation est relue par une autre personne de l'équipe que celle qui a décidé.",
} as const;

export const TEXTES_REGLAGES_MODERATION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_MODERATION>> = {
  fr: TEXTES_REGLAGES_MODERATION,
  en: TEXTES_REGLAGES_MODERATION_ANGLAIS,
};
