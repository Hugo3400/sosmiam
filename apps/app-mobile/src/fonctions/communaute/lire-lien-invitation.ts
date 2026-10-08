import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";

// « https://sosmiam.fr/invitation/lea.croque?c=k7mq2x9pa4vt », avec ou sans « https:// » ni « www. », suivi ou non de « / », de « ?… » ou de « #… »
const LIEN = /^(?:https?:\/\/)?(?:www\.)?sosmiam\.fr\/invitation\/([^/?#\s]+)\/?(?:\?([^#\s]*))?(?:#\S*)?$/i;
const CODE = /(?:^|&)c=([a-z0-9]{6,64})(?:&|$)/i;

export type InvitationLue = {
  /** Le pseudo du lien, sans « @ », en minuscules */
  pseudo: string;
  /** Le code secret du lien (« ?c=… »), ou null s'il manque : c'est l'API qui le vérifiera, la démo ne le regarde pas encore */
  code: string | null;
};

/**
 * Lit un lien d'invitation SOS Miam complet (scanné dans un QR code ou collé) : son pseudo et son code secret.
 * Rend null pour tout le reste, pseudo seul compris : un pseudo n'est pas une invitation, il se cherche comme un pseudo.
 */
export function lireLienInvitation(texte: string): InvitationLue | null {
  const trouve = LIEN.exec(texte.trim());
  if (!trouve) return null;
  let pseudo: string;
  try {
    pseudo = decodeURIComponent(trouve[1]).toLowerCase();
  } catch {
    return null;
  }
  if (!estPseudoValide(pseudo)) return null;
  const code = trouve[2] ? (CODE.exec(trouve[2])?.[1]?.toLowerCase() ?? null) : null;
  return { pseudo, code };
}
