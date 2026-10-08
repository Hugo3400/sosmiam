import {
  LONGUEUR_MAX_EXPLICATION_SIGNALEMENT,
  LONGUEUR_MIN_EXPLICATION_SIGNALEMENT,
  RAISONS_AVEC_EXPLICATION_OBLIGATOIRE,
} from "../regles/signalement";
import { RAISONS_SIGNALEMENT, type RaisonSignalement, type Signalement } from "../types/signalement";

/**
 * Vérifie qu'une donnée lue (téléphone, plus tard API) est un signalement complet :
 * raison connue, explication pas trop longue, et assez détaillée quand la raison l'exige.
 */
export function estSignalementValide(donnee: unknown): donnee is Signalement {
  if (typeof donnee !== "object" || donnee === null) return false;
  const s = donnee as Record<string, unknown>;
  if (typeof s.publicationId !== "string" || s.publicationId === "") return false;
  if (typeof s.lieuId !== "number" || !Number.isInteger(s.lieuId)) return false;
  if (typeof s.raison !== "string" || !(RAISONS_SIGNALEMENT as readonly string[]).includes(s.raison)) return false;
  if (s.precision !== null && typeof s.precision !== "string") return false;
  if (typeof s.date !== "string" || Number.isNaN(Date.parse(s.date))) return false;
  if (typeof s.explication !== "string" || s.explication.length > LONGUEUR_MAX_EXPLICATION_SIGNALEMENT) return false;
  const obligatoire = RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(s.raison as RaisonSignalement);
  return !obligatoire || s.explication.trim().length >= LONGUEUR_MIN_EXPLICATION_SIGNALEMENT;
}
