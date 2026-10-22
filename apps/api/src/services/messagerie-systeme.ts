import { randomUUID } from "node:crypto";

import { LONGUEUR_MAX_MESSAGE } from "../../../../packages/commun/src/regles/potes.ts";
import type { ChiffrementSocial } from "./chiffrement-social.ts";
import { SANS_AJOUTS } from "./messagerie-messages.ts";
import type { TablesMessagerie } from "./messagerie-regles.ts";

export const FORME_CODE_SYSTEME = /^[a-z][a-z-]{0,15}$/;

export async function ecrireMessageSysteme(
  t: TablesMessagerie, chiffrement: ChiffrementSocial, m: { conversationId: number; systeme: string; texte: string; maintenant: Date },
): Promise<{ messageId: number; version: number } | null> {
  if (!FORME_CODE_SYSTEME.test(m.systeme)) throw new Error("Code de message de SOS Miam invalide");
  if (m.texte.length === 0 || m.texte.length > LONGUEUR_MAX_MESSAGE) throw new Error("Texte de message de SOS Miam invalide");
  if (!(await t.verrouillerConversation(m.conversationId))) return null;
  const version = await t.toucherConversation(m.conversationId, m.maintenant, true);
  if (version === null) return null;
  const idClient = randomUUID();
  const message = await t.insererMessage({
    ...SANS_AJOUTS, conversationId: m.conversationId, auteurId: null, type: "texte", idClient, systeme: m.systeme, creeLe: m.maintenant,
    texteChiffre: chiffrement.chiffrerMessage(m.texte, m.conversationId, idClient),
    fichier: null, typeMime: null, taille: null, largeur: null, hauteur: null, dureeSecondes: null, mediaExpireLe: null,
    supprimeLe: null, suspenduLe: null, retireLe: null,
  });
  return message ? { messageId: message.id, version } : null;
}
