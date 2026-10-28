import { formaterPrixLangue } from "@sos-miam/commun/fonctions/langue/formater-prix-langue";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CHAMPS_EVENEMENT } from "~/contenus/textes-champs-evenement";

export const TEXTES_CHAMPS_EVENEMENT_ANGLAIS: Traduction<typeof TEXTES_CHAMPS_EVENEMENT> = {
  quand: {
    combienDeTemps: "How long?",
    sansFin: "No end time",
    duree: (heures: number) => `${heures} hour${heures === 1 ? "" : "s"}`,
    chaqueSemaine: "Every week",
    chaqueSemaineDetail: "Same day, same time",
    pendantSemaines: (semaines: number) => `For ${semaines} week${semaines === 1 ? "" : "s"}`,
  },
  tarif: {
    combien: "How much is it?",
    prix: "Approximate price (€)",
    prixAide: "The price for one person, as a rough guide",
    erreurPrix: (max: number) => `Between €0.01 and ${formaterPrixLangue(max, "en")}.`,
    places: "Limited spots",
    facultatif: "optional",
    sansLimite: "No limit",
    erreurPlaces: (max: number) => `Between 1 and ${max} spots.`,
    alcool: "There'll be alcohol",
    alcoolDetail: "The health warning shows next to it, and the event stays hidden from people browsing without an account. No open bars, ever.",
  },
  carte: {
    suspendu: "Suspended by the moderators",
    annule: "Cancelled",
    passe: "Over",
    interesses: (n: number) => `${n} interested`,
    quand: (jour: string, debut: string, fin: string | null) => `${jour} at ${debut}${fin ? `–${fin}` : ""}`,
    lu: (type: string, titre: string, quand: string, hebdo: boolean, interesses: string, etiquette: string | null) =>
      `${type}: ${titre}, ${quand}${hebdo ? ", every week" : ""}, ${interesses}${etiquette ? `, ${etiquette}` : ""}`,
    indice: "Opens the event so you can edit or cancel it",
    chaqueSemaineJusqua: (jour: string) => `Every week until ${jour}`,
  },
};
