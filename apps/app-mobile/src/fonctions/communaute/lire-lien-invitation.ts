import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";

// « https://sosmiam.fr/invitation/lea.croque », avec ou sans « https:// » ni « www. », suivi ou non de « / », « ? » ou « # »
const LIEN = /^(?:https?:\/\/)?(?:www\.)?sosmiam\.fr\/invitation\/([^/?#\s]+)\/?(?:[?#]\S*)?$/i;

/**
 * Lit un lien d'invitation SOS Miam (scanné dans un QR code ou collé) et rend le pseudo qu'il contient, sans « @ ».
 * Accepte aussi un pseudo seul (« @lea.croque » ou « lea.croque »). Rend null si ce n'est ni l'un ni l'autre.
 */
export function lireLienInvitation(texte: string): string | null {
  const propre = texte.trim();
  const trouve = LIEN.exec(propre);
  let pseudo: string;
  if (trouve) {
    try {
      pseudo = decodeURIComponent(trouve[1]);
    } catch {
      return null;
    }
  } else pseudo = propre.replace(/^@/, "");
  const minuscule = pseudo.toLowerCase();
  return estPseudoValide(minuscule) ? minuscule : null;
}
