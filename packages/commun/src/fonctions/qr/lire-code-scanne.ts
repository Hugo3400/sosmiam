import type { CodeScanne, VersionJetonComptoir } from "../../types/code-scanne.ts";

const LONGUEUR_MAX = 200;

// Hôte exactement « sosmiam.fr » ou « www.sosmiam.fr », avec « https:// » ou « http:// » facultatif
// QR du comptoir : « https://sosmiam.fr/v/<version>.<lieu>.<présentation>.<fenêtre>.<mac> », nombres en base 36
const COMPTOIR = /^(?:https?:\/\/)?(?:www\.)?sosmiam\.fr\/v\/(1|d)\.([0-9a-z]{1,8})\.([0-9a-z]{1,10})\.([0-9a-z]{1,10})\.([A-Za-z0-9_-]{11,22})\/?$/;
// QR de vitrine : « https://sosmiam.fr/l/<code public de 8 caractères> », suivi ou non de « / », de « ?… » ou de « #… »
const LIEU = /^(?:https?:\/\/)?(?:www\.)?sosmiam\.fr\/l\/([a-z2-9]{8})\/?(?:[?#]\S*)?$/;

/** Longueur de la signature selon la version : 22 caractères (128 bits) pour l'API, 11 pour la démo */
const LONGUEUR_MAC: Readonly<Record<VersionJetonComptoir, number>> = { "1": 22, d: 11 };

/**
 * Reconnaît ce qu'on vient de scanner : un QR du comptoir (jeton à vérifier ensuite), un QR de vitrine (code public
 * du lieu) ou autre chose. Tout le reste, liens d'invitation compris, rend `{ type: "autre" }` : un QR d'invitation
 * ne doit jamais passer par le scanner du comptoir.
 */
export function lireCodeScanne(texte: string): CodeScanne {
  if (typeof texte !== "string") return { type: "autre" };
  const nettoye = texte.trim();
  if (nettoye.length > LONGUEUR_MAX) return { type: "autre" };

  const comptoir = COMPTOIR.exec(nettoye);
  if (comptoir) {
    const version = comptoir[1] as VersionJetonComptoir;
    const mac = comptoir[5];
    if (mac.length !== LONGUEUR_MAC[version]) return { type: "autre" };
    return {
      type: "comptoir",
      jeton: {
        version,
        lieuId: Number.parseInt(comptoir[2], 36),
        presentationId: Number.parseInt(comptoir[3], 36),
        fenetre: Number.parseInt(comptoir[4], 36),
        mac,
      },
    };
  }

  const lieu = LIEU.exec(nettoye);
  if (lieu) return { type: "lieu", codePublic: lieu[1] };
  return { type: "autre" };
}
