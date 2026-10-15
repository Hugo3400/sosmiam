import { FORME_ID_PUBLIC } from "../regles/potes.ts";
import {
  CIBLES_SIGNALEMENT_SOCIAL,
  LONGUEUR_MAX_EXPLICATION_SIGNALEMENT,
  LONGUEUR_MAX_PRECISION_SIGNALEMENT,
  LONGUEUR_MIN_EXPLICATION_SIGNALEMENT,
  RAISONS_AVEC_EXPLICATION_OBLIGATOIRE,
} from "../regles/signalement.ts";
import { RAISONS_SIGNALEMENT, type CibleSignalementSocial, type RaisonSignalement, type SignalementSocialValide } from "../types/signalement.ts";
import { estTexteAffichable } from "./est-texte-affichable.ts";

/** Identifiant d'un commentaire, d'un message, d'une liste, d'une sortie ou d'un groupe, comme dans les adresses de l'API */
const FORME_ID_CONTENU = /^[1-9]\d{0,8}$/;

/**
 * Vérifie un signalement de contenu social lu tel quel dans le corps de la demande (POST /app/signalements) et le rend
 * nettoyé, ou null :
 * - cible : commentaire, message, liste, profil, sortie ou groupe (« recommandation » n'existe plus : c'est un message) ;
 * - cibleId : l'identifiant public de la personne pour un profil, l'identifiant du contenu sinon ;
 * - raison : une des RAISONS_SIGNALEMENT ; precision : 80 caractères au plus, ou null (vide : null) ;
 * - explication : 500 caractères au plus après trim, 10 au moins quand la raison l'exige (« autre »).
 * Une précision ou une explication écrite doit pouvoir s'afficher (estTexteAffichable : pas que de l'invisible, pas de
 * caractère de contrôle) ; le filtre de mots ne s'y applique pas : on cite souvent le mot qu'on signale.
 */
export function validerSignalementContenu(brut: unknown): SignalementSocialValide | null {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return null;
  const s = brut as Record<string, unknown>;

  if (typeof s.cible !== "string" || !(CIBLES_SIGNALEMENT_SOCIAL as readonly string[]).includes(s.cible)) return null;
  const cible = s.cible as CibleSignalementSocial;
  const formeId = cible === "profil" ? FORME_ID_PUBLIC : FORME_ID_CONTENU;
  if (typeof s.cibleId !== "string" || !formeId.test(s.cibleId)) return null;

  if (typeof s.raison !== "string" || !(RAISONS_SIGNALEMENT as readonly string[]).includes(s.raison)) return null;
  const raison = s.raison as RaisonSignalement;

  if (s.precision !== undefined && s.precision !== null && typeof s.precision !== "string") return null;
  const precision = typeof s.precision === "string" ? s.precision.trim() : "";
  if (precision.length > LONGUEUR_MAX_PRECISION_SIGNALEMENT || (precision !== "" && !estTexteAffichable(precision))) return null;

  if (s.explication !== undefined && s.explication !== null && typeof s.explication !== "string") return null;
  const explication = typeof s.explication === "string" ? s.explication.trim() : "";
  if (explication.length > LONGUEUR_MAX_EXPLICATION_SIGNALEMENT || (explication !== "" && !estTexteAffichable(explication))) return null;
  if (RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(raison) && explication.length < LONGUEUR_MIN_EXPLICATION_SIGNALEMENT) return null;

  return { cible, cibleId: s.cibleId, raison, precision: precision === "" ? null : precision, explication };
}
