import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import type { Pote } from "@sos-miam/commun/types/potes";

/**
 * Ton profil communautaire, tel que tes potes le verront, à partir de ce que le téléphone sait de toi. id : ton identifiant
 * dans les données affichées (« moi » pour celles du téléphone, ton identifiant public pour celles du compte).
 */
export function construireMoi(donnees: {
  id: string;
  pseudo: string;
  prenom: string;
  avatar: string;
  ville: string;
  points: number;
  rescoussesDuMois: number;
  lieuxSauves: number[];
  gardes: number[];
  badges: string[];
}): Pote {
  const { rescoussesDuMois, ...reste } = donnees;
  // Points du mois : ceux des rescousses du mois, seule activité que le téléphone compte mois par mois
  return { ...reste, rescoussesDuMois, pointsDuMois: rescoussesDuMois * POINTS_AMBASSADEUR.rescousse };
}
