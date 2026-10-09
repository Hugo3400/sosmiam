// Champs d'une fiche de lieu qu'une suggestion (client ou lieu) peut changer : ni le statut, ni la note de l'équipe, ni
// l'emoji, les couleurs ou « Déniché par ». À part pour être lu par les contrôleurs sans charger la base.
export const CHAMPS_SUGGERABLES = [
  "nom", "type", "info", "texte", "adresse", "quartier", "ville", "latitude", "longitude", "prix", "prixMoyen", "horaires",
  "ouverture", "plat", "tags", "envies", "reservable", "telephone", "siteWeb", "instagram",
] as const;
export type ChampSuggerable = (typeof CHAMPS_SUGGERABLES)[number];
