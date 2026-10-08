import type { SuivisPersonnesLocaux } from "~/stockage/suivis-personnes-locaux";

// Suivre entre personnes, en démo : qui suit qui parmi les potes d'exemple (potes-exemples.ts), qui est en privé,
// et comment ils réagissent quand tu les suis. Tout est fixe (pas de hasard) : les tests se rejouent à l'identique.

/** Comptes adultes privés de la démo (Inès et Jade sont privées d'office, car mineures) */
export const comptesPrivesExemples: readonly string[] = ["camille"];

/** Qui suit qui entre personnes d'exemple. Aucun lien entre un adulte et un mineur. */
export const grapheSuivisExemples: Readonly<Record<string, readonly string[]>> = {
  lea: ["karim", "sofia", "camille", "tom"],
  karim: ["lea", "tom", "max"],
  tom: ["lea", "karim", "sofia"],
  sofia: ["lea", "camille", "max"],
  camille: ["lea", "sofia"],
  max: ["sofia"],
  ines: ["jade"],
  jade: ["ines"],
};

/** La bande de chaque personne d'exemple (pour les « potes de potes ») ; une bande peut mêler adultes et ados */
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
  jade: { accepteApres: 5000 },
  ines: { accepteApres: 5000 },
};

/** Un adulte qui passe en privé reçoit cette demande un peu plus tard */
export const DEMANDE_APRES_PASSAGE_PRIVE = { id: "tom", apres: 8000 } as const;

const ilYa = (maintenant: Date, heures: number) => new Date(maintenant.getTime() - heures * 3_600_000).toISOString();

/**
 * Données de départ (âge connu seulement). Adulte : compte public, suivi par Léa, Karim et Sofia, et qui suit Léa et Karim.
 * 15-17 ans : compte privé, Inès dans les deux sens, et une demande de Jade à accepter.
 */
export function creerSuivisDemo(moiMineur: boolean, maintenant: Date): Omit<SuivisPersonnesLocaux, "version" | "profilCreeLe"> {
  if (moiMineur) {
    return {
      confidentialite: "prive",
      abonnes: [{ id: "ines", depuis: ilYa(maintenant, 72) }],
      abonnements: [{ id: "ines", depuis: ilYa(maintenant, 72) }],
      demandesRecues: [{ id: "jade", depuis: ilYa(maintenant, 1) }],
      demandesEnvoyees: [],
      suggestionsMasquees: [],
      etaitMineur: true,
    };
  }
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
    etaitMineur: false,
  };
}
