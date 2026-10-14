import { estPseudoValide } from "../../validation/est-pseudo-valide.ts";

// « https://sosmiam.fr/invitation/lea.croque#c=k7mq2x9pa4vt » (ou l'ancien « ?c=… »), avec ou sans « https:// » ni
// « www. », et le lien de secours de l'app « sosmiam://invitation/lea.croque#c=… » ; « @ » toléré devant le pseudo, suivi
// ou non de « / ». Même règle que apps/app-mobile/src/fonctions/communaute/lire-lien-invitation.ts
const LIEN = /^(?:(?:https?:\/\/)?(?:www\.)?sosmiam\.fr\/|sosmiam:\/\/)invitation\/([^/?#\s]+)\/?(?:\?([^#\s]*))?(?:#(\S*))?$/i;
const CODE = /(?:^|&)c=([a-z0-9]{6,64})(?:&|$)/i;

export type LienInvitationLu = {
  /** Le pseudo du lien, sans « @ », en minuscules */
  pseudo: string;
  /** Le code secret du lien (« #c=… », ou l'ancien « ?c=… »), en minuscules, ou null s'il manque : c'est l'API qui le vérifie */
  code: string | null;
};

/**
 * Lit un lien d'invitation SOS Miam complet (scanné dans un QR code, collé, ou ouvert par le site avec le lien de secours
 * « sosmiam:// ») : son pseudo et son code secret, pris dans le fragment (« #c= ») ou, pour les anciens liens, dans
 * « ?c= ». Rend null pour tout le reste, pseudo seul compris : un pseudo n'est pas une invitation, il se cherche comme un
 * pseudo.
 */
export function lireLienInvitation(texte: string): LienInvitationLu | null {
  const trouve = LIEN.exec(texte.trim());
  if (!trouve) return null;
  let pseudo: string;
  try {
    pseudo = decodeURIComponent(trouve[1]).replace(/^@/, "").toLowerCase();
  } catch {
    return null;
  }
  if (!estPseudoValide(pseudo)) return null;
  const code = CODE.exec(trouve[3] ?? "")?.[1] ?? CODE.exec(trouve[2] ?? "")?.[1] ?? null;
  return { pseudo, code: code?.toLowerCase() ?? null };
}
