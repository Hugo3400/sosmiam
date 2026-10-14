import type { SuivisPersonnesLocaux } from "~/stockage/suivis-personnes-locaux";

// Suivre entre personnes, en démo : qui suit qui parmi les potes d'exemple (potes-exemples.ts), qui est en privé,
// et comment ils réagissent quand tu les suis. Tout est fixe (pas de hasard) : les tests se rejouent à l'identique.

/** Comptes privés de la démo (les autres sont publics) */
export const comptesPrivesExemples: readonly string[] = ["camille"];

/** Qui suit qui entre personnes d'exemple */
export const grapheSuivisExemples: Readonly<Record<string, readonly string[]>> = {
  lea: ["karim", "sofia", "camille", "tom"],
  karim: ["lea", "tom", "max"],
  tom: ["lea", "karim", "sofia"],
  sofia: ["lea", "camille", "max"],
  camille: ["lea", "sofia"],
  max: ["sofia"],
  ines: ["jade", "lea"],
  jade: ["ines", "sofia"],
};

/** La bande de chaque personne d'exemple (pour les « potes de potes ») */
export const bandesExemples: Readonly<Record<string, readonly string[]>> = {
  lea: ["karim", "tom", "sofia", "camille"],
  karim: ["lea", "tom", "max"],
  tom: ["lea", "karim", "sofia"],
  ines: ["jade", "lea"],
  sofia: ["lea", "tom", "camille"],
  max: ["karim"],
  camille: ["lea", "sofia"],
  jade: ["ines"],
};

/** Réactions de la démo, toujours les mêmes (pour les tests), en millisecondes */
export const reactionsExemples: Readonly<Record<string, { suitEnRetourApres?: number; accepteApres?: number }>> = {
  sofia: { suitEnRetourApres: 4000 },
  max: { suitEnRetourApres: 4000 },
  camille: { accepteApres: 5000 },
};

/** Quand tu passes en privé, tu reçois cette demande un peu plus tard */
export const DEMANDE_APRES_PASSAGE_PRIVE = { id: "tom", apres: 8000 } as const;

const ilYa = (maintenant: Date, heures: number) => new Date(maintenant.getTime() - heures * 3_600_000).toISOString();

/** Données de départ (avec un profil seulement) : compte public, suivi par Léa, Karim et Sofia, et qui suit Léa et Karim. */
export function creerSuivisDemo(maintenant: Date): Omit<SuivisPersonnesLocaux, "version" | "profilCreeLe"> {
  return {
    confidentialite: "public",
    abonnes: [
      { id: "lea", depuis: ilYa(maintenant, 48) },
      { id: "karim", depuis: ilYa(maintenant, 120) },
      { id: "sofia", depuis: ilYa(maintenant, 3) },
    ],
    abonnements: [
      { id: "lea", depuis: ilYa(maintenant, 48) },
      { id: "karim", depuis: ilYa(maintenant, 96) },
    ],
    demandesRecues: [],
    demandesEnvoyees: [],
    suggestionsMasquees: [],
  };
}
