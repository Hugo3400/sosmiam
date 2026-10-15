import { LONGUEUR_MAX_TITRE_GROUPE, MAX_PARTICIPANTS_GROUPE } from "../regles/chat.ts";
import { FORME_ID_PUBLIC } from "../regles/potes.ts";
import type { NouveauGroupeApi } from "../types/messagerie.ts";
import { estEmojiSeul } from "./est-emoji-seul.ts";
import { nettoyerTexteSocial } from "./nettoyer-texte-social.ts";
import { verifierTexteSocial } from "./verifier-texte-social.ts";

export type ChampNouveauGroupe = "titre" | "emoji" | "invites";

export type ResultatNouveauGroupe = { ok: true; groupe: NouveauGroupeApi } | { ok: false; champ: ChampNouveauGroupe; raison?: "mot-interdit" };

/**
 * Vérifie un nouveau groupe (lu tel quel dans le corps de la demande) : titre de 1 à 40 caractères après trim, sans mot
 * interdit (raison « mot-interdit »), un seul emoji, et 1 à 19 invités (identifiants publics, sans doublon) : avec toi,
 * 20 personnes. On n'entre dans un groupe qu'en acceptant (réponse de Hugo du 14/10/2026) : chaque invité reçoit une
 * invitation à accepter. Que les invités soient de ta bande, c'est l'API qui le vérifie. Rend le groupe nettoyé.
 */
export function validerNouveauGroupe(g: { [Champ in keyof NouveauGroupeApi]?: unknown }): ResultatNouveauGroupe {
  if (typeof g.titre !== "string") return { ok: false, champ: "titre" };
  const titre = verifierTexteSocial(g.titre, LONGUEUR_MAX_TITRE_GROUPE);
  if (titre === "mot-interdit") return { ok: false, champ: "titre", raison: "mot-interdit" };
  if (titre !== "ok") return { ok: false, champ: "titre" };

  const emoji = typeof g.emoji === "string" ? g.emoji.trim() : null;
  if (!estEmojiSeul(emoji)) return { ok: false, champ: "emoji" };

  const invites = g.invites;
  if (
    !Array.isArray(invites) ||
    invites.length < 1 ||
    invites.length > MAX_PARTICIPANTS_GROUPE - 1 ||
    !invites.every((id) => typeof id === "string" && FORME_ID_PUBLIC.test(id)) ||
    new Set(invites).size !== invites.length
  ) {
    return { ok: false, champ: "invites" };
  }

  return { ok: true, groupe: { titre: nettoyerTexteSocial(g.titre), emoji, invites: invites as string[] } };
}
