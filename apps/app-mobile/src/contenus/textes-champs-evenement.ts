import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CHAMPS_EVENEMENT_ANGLAIS } from "~/contenus/anglais/textes-champs-evenement";

export const TEXTES_CHAMPS_EVENEMENT = {
  quand: {
    combienDeTemps: "Combien de temps ?",
    sansFin: "Pas d'heure de fin",
    duree: (heures: number) => `${heures} h`,
    chaqueSemaine: "Chaque semaine",
    chaqueSemaineDetail: "Même jour, même heure",
    pendantSemaines: (semaines: number) => `Pendant ${semaines} semaines`,
  },
  tarif: {
    combien: "Combien ça coûte ?",
    prix: "Prix indicatif (€)",
    prixAide: "Le prix pour une personne, à titre indicatif",
    erreurPrix: (max: number) => `Entre 0,01 et ${max} €.`,
    places: "Places limitées",
    facultatif: "facultatif",
    sansLimite: "Pas de limite",
    erreurPlaces: (max: number) => `Entre 1 et ${max} places.`,
    alcool: "Il y a de l'alcool",
    alcoolDetail: "Le message sanitaire s'affiche à côté, et l'événement reste caché en visite sans compte. Jamais d'open bar.",
  },
  carte: {
    suspendu: "Suspendu par la modération",
    annule: "Annulé",
    passe: "Passé",
    interesses: (n: number) => `${n} intéressé${n > 1 ? "s" : ""}`,
    quand: (jour: string, debut: string, fin: string | null) => `${jour} à ${debut}${fin ? ` – ${fin}` : ""}`,
    lu: (type: string, titre: string, quand: string, hebdo: boolean, interesses: string, etiquette: string | null) =>
      `${type} : ${titre}, ${quand}${hebdo ? ", chaque semaine" : ""}, ${interesses}${etiquette ? `, ${etiquette}` : ""}`,
    indice: "Ouvre l'événement pour le modifier ou l'annuler",
    chaqueSemaineJusqua: (jour: string) => `Chaque semaine jusqu'au ${jour.toLowerCase()}`,
  },
};

export const TEXTES_CHAMPS_EVENEMENT_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CHAMPS_EVENEMENT>> = { fr: TEXTES_CHAMPS_EVENEMENT, en: TEXTES_CHAMPS_EVENEMENT_ANGLAIS };
