import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";

// « https://sosmiam.fr/invitation/lea.croque#c=k7mq2x9pa4vt » (ou l'ancien « ?c= »), avec ou sans « https:// » ni « www. »,
// et le lien de secours de l'app « sosmiam://invitation/lea.croque#c=… » ; suivi ou non de « / »
const LIEN = /^(?:(?:https?:\/\/)?(?:www\.)?sosmiam\.fr\/|sosmiam:\/\/)invitation\/([^/?#\s]+)\/?(?:\?([^#\s]*))?(?:#(\S*))?$/i;
const CODE = /(?:^|&)c=([a-z0-9]{6,64})(?:&|$)/i;

export type InvitationLue = {
  /** Le pseudo du lien, sans « @ », en minuscules */
  pseudo: string;
  /** Le code secret du lien (« #c=… », ou l'ancien « ?c=… »), ou null s'il manque : c'est l'API qui le vérifie */
  code: string | null;
};

/**
 * Lit un lien d'invitation SOS Miam complet (scanné dans un QR code, collé, ou ouvert par le site) : son pseudo et son
 * code secret. Rend null pour tout le reste, pseudo seul compris : un pseudo n'est pas une invitation, il se cherche comme
 * un pseudo.
 */
export function lireLienInvitation(texte: string): InvitationLue | null {
  const trouve = LIEN.exec(texte.trim());
  if (!trouve) return null;
  let pseudo: string;
  try {
    pseudo = decodeURIComponent(trouve[1]).replace(/^@/, "").toLowerCase();
  } catch {
    return null;
  }
  if (!estPseudoValide(pseudo)) return null;
  // Le fragment d'abord (jamais envoyé au serveur du site), puis l'ancien « ?c= »
  const code = (trouve[3] ? CODE.exec(trouve[3])?.[1] : undefined) ?? (trouve[2] ? CODE.exec(trouve[2])?.[1] : undefined) ?? null;
  return { pseudo, code: code ? code.toLowerCase() : null };
}
