import {
  DELAI_MAX_SORTIE_JOURS,
  DELAI_MIN_FIN_VOTE_MINUTES,
  DELAI_MIN_SORTIE_MINUTES,
  FORME_ID_PUBLIC,
  LONGUEUR_MAX_TITRE_SORTIE,
  MAX_PARTICIPANTS_SORTIE,
  MAX_PROPOSITIONS_SORTIE,
} from "../regles/potes.ts";
import type { NouvelleSortieApi } from "../types/sorties.ts";
import { estEmojiSeul } from "./est-emoji-seul.ts";
import { nettoyerTexteSocial } from "./nettoyer-texte-social.ts";
import { verifierTexteSocial } from "./verifier-texte-social.ts";

const MINUTE_MS = 60_000;
const JOUR_MS = 24 * 60 * MINUTE_MS;
/** Une date ISO 8601 complète, avec son fuseau (« 2026-10-16T19:30:00.000Z », « 2026-10-16T21:30+02:00 ») */
const FORME_DATE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
/** Identifiant d'un lieu, comme dans les adresses de l'API */
const ID_LIEU_MAX = 999_999_999;

export type ChampNouvelleSortie = "titre" | "emoji" | "quand" | "finVote" | "invites" | "lieux";

export type ResultatNouvelleSortie =
  | { ok: true; sortie: NouvelleSortieApi }
  | { ok: false; champ: ChampNouvelleSortie; raison?: "mot-interdit" };

function lireInstant(brut: unknown): number | null {
  if (typeof brut !== "string" || !FORME_DATE_ISO.test(brut)) return null;
  const instant = Date.parse(brut);
  return Number.isNaN(instant) ? null : instant;
}

/**
 * Vérifie une nouvelle sortie (lue telle quelle dans le corps de la demande, d'où les champs « unknown ») :
 * - titre : 1 à 40 caractères après trim, sans mot interdit (raison « mot-interdit ») ; un seul emoji ;
 * - quand : au moins 15 minutes plus tard, au plus 366 jours ;
 * - finVote : au moins 10 minutes plus tard, et au plus tard à « quand » ;
 * - invites : 1 à 14 identifiants publics, sans doublon (avec l'organisateur, 15 personnes) ;
 * - lieux : 1 à 8 identifiants de lieux, dédoublonnés (dans l'ordre).
 * Rend la sortie nettoyée (titre et emoji sans espaces autour, dates en ISO UTC). Que les invités soient de ta bande et les
 * lieux publiés, c'est l'API qui le vérifie.
 */
export function validerNouvelleSortie(s: { [Champ in keyof NouvelleSortieApi]?: unknown }, maintenant: Date): ResultatNouvelleSortie {
  if (typeof s.titre !== "string") return { ok: false, champ: "titre" };
  const titre = verifierTexteSocial(s.titre, LONGUEUR_MAX_TITRE_SORTIE);
  if (titre === "mot-interdit") return { ok: false, champ: "titre", raison: "mot-interdit" };
  if (titre !== "ok") return { ok: false, champ: "titre" };

  const emoji = typeof s.emoji === "string" ? s.emoji.trim() : null;
  if (!estEmojiSeul(emoji)) return { ok: false, champ: "emoji" };

  const maintenantMs = maintenant.getTime();
  const quand = lireInstant(s.quand);
  if (quand === null || quand < maintenantMs + DELAI_MIN_SORTIE_MINUTES * MINUTE_MS || quand > maintenantMs + DELAI_MAX_SORTIE_JOURS * JOUR_MS) {
    return { ok: false, champ: "quand" };
  }
  const finVote = lireInstant(s.finVote);
  if (finVote === null || finVote < maintenantMs + DELAI_MIN_FIN_VOTE_MINUTES * MINUTE_MS || finVote > quand) {
    return { ok: false, champ: "finVote" };
  }

  const invites = s.invites;
  if (
    !Array.isArray(invites) ||
    invites.length < 1 ||
    invites.length > MAX_PARTICIPANTS_SORTIE - 1 ||
    !invites.every((id) => typeof id === "string" && FORME_ID_PUBLIC.test(id)) ||
    new Set(invites).size !== invites.length
  ) {
    return { ok: false, champ: "invites" };
  }

  if (!Array.isArray(s.lieux) || !s.lieux.every((id) => Number.isInteger(id) && id >= 1 && id <= ID_LIEU_MAX)) {
    return { ok: false, champ: "lieux" };
  }
  const lieux = [...new Set(s.lieux as number[])];
  if (lieux.length < 1 || lieux.length > MAX_PROPOSITIONS_SORTIE) return { ok: false, champ: "lieux" };

  return {
    ok: true,
    sortie: {
      titre: nettoyerTexteSocial(s.titre),
      emoji,
      quand: new Date(quand).toISOString(),
      finVote: new Date(finVote).toISOString(),
      invites: invites as string[],
      lieux,
    },
  };
}
