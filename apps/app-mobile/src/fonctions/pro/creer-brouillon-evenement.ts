import type { EvenementLieuPro, TarifEvenement, TypeEvenement } from "@sos-miam/commun/types/evenement";

/** Ce que l'équipe remplit dans le formulaire d'un événement (les nombres restent du texte tant qu'on tape) */
export type BrouillonEvenement = {
  titre: string;
  type: TypeEvenement;
  description: string;
  debut: Date;
  /** Durée en heures (null : pas d'heure de fin annoncée) */
  dureeHeures: number | null;
  /** Chaque semaine pendant tant de semaines après la première (null : une seule fois) */
  semaines: number | null;
  tarif: TarifEvenement;
  /** « 12 » ou « 12,50 » */
  prix: string;
  /** Vide : pas de limite */
  places: string;
  alcool: boolean;
};

const HEURE_MS = 60 * 60_000;
const SEMAINE_MS = 7 * 24 * HEURE_MS;

/** Le brouillon d'un nouvel événement (vendredi prochain à 20 h), ou celui d'un événement existant à modifier. */
export function creerBrouillonEvenement(existant: EvenementLieuPro | null, maintenant: Date = new Date()): BrouillonEvenement {
  if (existant) {
    const debut = new Date(existant.debut);
    return {
      titre: existant.titre,
      type: existant.type,
      description: existant.description,
      debut,
      dureeHeures: existant.fin ? Math.round((Date.parse(existant.fin) - debut.getTime()) / HEURE_MS) || 1 : null,
      semaines: existant.hebdoJusqua ? Math.max(1, Math.round((Date.parse(existant.hebdoJusqua) - debut.getTime()) / SEMAINE_MS)) : null,
      tarif: existant.tarif,
      prix: existant.prixCentimes === null ? "" : String(existant.prixCentimes / 100).replace(".", ","),
      places: existant.places === null ? "" : String(existant.places),
      alcool: existant.alcool,
    };
  }
  const debut = new Date(maintenant);
  debut.setDate(debut.getDate() + ((5 - debut.getDay() + 7) % 7 || 7));
  debut.setHours(20, 0, 0, 0);
  return { titre: "", type: "concert", description: "", debut, dureeHeures: 3, semaines: null, tarif: "gratuit", prix: "", places: "", alcool: false };
}
