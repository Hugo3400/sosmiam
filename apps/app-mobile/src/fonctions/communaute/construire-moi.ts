import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";

/** Ton profil communautaire, tel que tes potes le verront, à partir de ce que le téléphone sait de toi. */
export function construireMoi(donnees: {
  pseudo: string;
  prenom: string;
  avatar: string;
  ville: string;
  mineur: boolean;
  points: number;
  rescoussesDuMois: number;
  lieuxSauves: number[];
  gardes: number[];
  badges: string[];
}): Pote {
  const { rescoussesDuMois, ...reste } = donnees;
  // Points du mois : ceux des rescousses du mois, seule activité que le téléphone compte mois par mois
  return { id: ID_MOI, ...reste, rescoussesDuMois, pointsDuMois: rescoussesDuMois * POINTS_AMBASSADEUR.rescousse };
}
