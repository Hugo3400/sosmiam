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
import { nettoyerTexteSocial } from "./nettoyer-texte-social.ts";

/** Identifiant d'un commentaire, d'un message, d'une liste, d'une sortie ou d'un groupe, comme dans les adresses de l'API */
const FORME_ID_CONTENU = /^[1-9]\d{0,8}$/;
/** Les caractères de contrôle (\p{Cc}) sauf la tabulation et le retour à la ligne : ceux que refuse estTexteAffichable */
const CONTROLES = /(?![\t\n])\p{Cc}/gu;

/**
 * Une précision ou une explication telle qu'on la garde : fins de ligne \r\n et \r changées en \n, caractères de
 * contrôle retirés (un octet nul collé par mégarde ne fait jamais perdre un signalement), sans espaces autour ; "" s'il
 * ne reste rien de visible (estTexteAffichable).
 */
function nettoyerTexteSignalement(brut: string): string {
  const propre = nettoyerTexteSocial(brut).replace(CONTROLES, "").trim();
  return estTexteAffichable(propre) ? propre : "";
}

/**
 * Vérifie un signalement de contenu social lu tel quel dans le corps de la demande (POST /app/signalements) et le rend
 * nettoyé, ou null :
 * - cible : commentaire, message, liste, profil, sortie ou groupe (« recommandation » n'existe plus : c'est un message) ;
 * - cibleId : l'identifiant public de la personne pour un profil, l'identifiant du contenu sinon ;
 * - raison : une des RAISONS_SIGNALEMENT ; precision : 80 caractères au plus, ou null (vide : null) ;
 * - explication : 500 caractères au plus après nettoyage, 10 au moins quand la raison l'exige (« autre »).
 * Un caractère de contrôle n'est jamais une raison de refus : il est retiré (nettoyerTexteSignalement). Une précision ou
 * une explication qui ne montre rien (que de l'invisible) compte comme vide : refusée seulement quand l'explication est
 * obligatoire. Le filtre de mots ne s'y applique pas : on cite souvent le mot qu'on signale.
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
  const precision = typeof s.precision === "string" ? nettoyerTexteSignalement(s.precision) : "";
  if (precision.length > LONGUEUR_MAX_PRECISION_SIGNALEMENT) return null;

  if (s.explication !== undefined && s.explication !== null && typeof s.explication !== "string") return null;
  const explication = typeof s.explication === "string" ? nettoyerTexteSignalement(s.explication) : "";
  if (explication.length > LONGUEUR_MAX_EXPLICATION_SIGNALEMENT) return null;
  if (RAISONS_AVEC_EXPLICATION_OBLIGATOIRE.includes(raison) && explication.length < LONGUEUR_MIN_EXPLICATION_SIGNALEMENT) return null;

  return { cible, cibleId: s.cibleId, raison, precision: precision === "" ? null : precision, explication };
}
