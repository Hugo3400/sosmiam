import type { PartieInfosPratiques } from "~/composants/lieux/ChampsInfosPratiques";

/** Ce qui peut avoir changé sur la fiche d'un lieu, à cocher avant de proposer une modification */
export type SujetProposition = "horaires" | "adresse" | "nom" | "contact" | "animaux" | "equipements" | "reservation" | "paiements" | "texte";

/** Les sujets dans l'ordre où on les propose (les plus fréquents d'abord), avec le morceau des infos pratiques qui va avec */
export const sujetsProposition: readonly { sujet: SujetProposition; emoji: string; libelle: string; partie?: PartieInfosPratiques }[] = [
  { sujet: "horaires", emoji: "🕐", libelle: "Horaires" },
  { sujet: "contact", emoji: "📞", libelle: "Téléphone, site", partie: "contact" },
  { sujet: "adresse", emoji: "📍", libelle: "Adresse" },
  { sujet: "animaux", emoji: "🐶", libelle: "Animaux", partie: "animaux" },
  { sujet: "equipements", emoji: "♿", libelle: "Accès, terrasse…", partie: "equipements" },
  { sujet: "paiements", emoji: "💳", libelle: "Paiements", partie: "paiements" },
  { sujet: "reservation", emoji: "📅", libelle: "Réservation", partie: "reservation" },
  { sujet: "nom", emoji: "🏷️", libelle: "Nom" },
  { sujet: "texte", emoji: "✍️", libelle: "Présentation" },
];
