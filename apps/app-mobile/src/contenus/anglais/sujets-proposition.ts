import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { sujetsProposition } from "~/contenus/sujets-proposition";

export const sujetsPropositionAnglais: Traduction<typeof sujetsProposition> = [
  { sujet: "horaires", emoji: "🕐", libelle: "Opening hours" },
  { sujet: "contact", emoji: "📞", libelle: "Phone, website", partie: "contact" },
  { sujet: "adresse", emoji: "📍", libelle: "Address" },
  { sujet: "animaux", emoji: "🐶", libelle: "Pets", partie: "animaux" },
  { sujet: "equipements", emoji: "♿", libelle: "Access, terrace…", partie: "equipements" },
  { sujet: "paiements", emoji: "💳", libelle: "Payments", partie: "paiements" },
  { sujet: "reservation", emoji: "📅", libelle: "Booking", partie: "reservation" },
  { sujet: "nom", emoji: "🏷️", libelle: "Name" },
  { sujet: "texte", emoji: "✍️", libelle: "Description" },
];
