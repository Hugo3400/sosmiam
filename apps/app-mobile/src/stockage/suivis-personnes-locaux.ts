// Suivre entre personnes (démo) : abonnés, abonnements, demandes et ton choix public / privé, gardés sur le téléphone en attendant l'API.
// Les lieux et créateurs suivis restent dans l'activité (sosmiam.activite) : ici, seulement les personnes.
// Rien de sensible : AsyncStorage suffit. Les anciens champs « etaitMineur » et « surveillance » sont ignorés à la lecture.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Confidentialite, LienSuivi } from "@sos-miam/commun/types/suivis";

export type SuivisPersonnesLocaux = {
  version: 1;
  /** Profil.creeLe du profil pour lequel la démo a été créée : un autre profil repart d'une démo neuve */
  profilCreeLe: string;
  /** Ton choix : public ou privé */
  confidentialite: Confidentialite;
  /** Ceux que tu suis (acceptés) */
  abonnements: LienSuivi[];
  /** En attente chez eux */
  demandesEnvoyees: LienSuivi[];
  /** Ceux qui te suivent */
  abonnes: LienSuivi[];
  /** À accepter ou refuser */
  demandesRecues: LienSuivi[];
  /** Clés de suivi des suggestions masquées (✕) */
  suggestionsMasquees: string[];
};

const CLE = "sosmiam.suivis-personnes";

/** Les liens bien formés, sans doublon (le premier gardé) */
function lireLiens(valeur: unknown): LienSuivi[] {
  if (!Array.isArray(valeur)) return [];
  const vus = new Set<string>();
  const liens: LienSuivi[] = [];
  for (const brut of valeur) {
    const lien = brut as Partial<LienSuivi> | null;
    if (typeof lien?.id !== "string" || !lien.id || typeof lien.depuis !== "string" || vus.has(lien.id)) continue;
    vus.add(lien.id);
    liens.push({ id: lien.id, depuis: lien.depuis });
  }
  return liens;
}

/** Lit les suivis entre personnes gardés sur le téléphone (null si rien, ou illisible : la démo repart alors de zéro). */
export async function lireSuivisPersonnesLocaux(): Promise<SuivisPersonnesLocaux | null> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<SuivisPersonnesLocaux> | null;
    if (!lu || typeof lu.profilCreeLe !== "string") return null;
    const masquees = Array.isArray(lu.suggestionsMasquees) ? lu.suggestionsMasquees.filter((c): c is string => typeof c === "string") : [];
    return {
      version: 1,
      profilCreeLe: lu.profilCreeLe,
      confidentialite: lu.confidentialite === "prive" ? "prive" : "public",
      abonnements: lireLiens(lu.abonnements),
      demandesEnvoyees: lireLiens(lu.demandesEnvoyees),
      abonnes: lireLiens(lu.abonnes),
      demandesRecues: lireLiens(lu.demandesRecues),
      suggestionsMasquees: [...new Set(masquees)],
    };
  } catch {
    return null;
  }
}

/** Enregistre les suivis entre personnes sur le téléphone. */
export async function enregistrerSuivisPersonnesLocaux(etat: SuivisPersonnesLocaux): Promise<void> {
  await AsyncStorage.setItem(CLE, JSON.stringify(etat));
}

/** Efface les suivis entre personnes du téléphone (« Tout effacer »). */
export async function effacerSuivisPersonnesLocaux(): Promise<void> {
  await AsyncStorage.removeItem(CLE);
}
