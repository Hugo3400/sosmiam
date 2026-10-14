// sosmiam.fr/q/<code> (le QR d'un appareil à connecter, ouvert aussi par l'appareil photo du téléphone), le lien de secours
// sosmiam://q/<code>, ou le code seul : 32 caractères [a-z2-9]
const LIEN = /^(?:(?:https?:\/\/)?(?:www\.)?sosmiam\.fr\/|sosmiam:\/\/)q\/([a-z2-9]{32})\/?(?:[?#]\S*)?$/i;
const CODE = /^[a-z2-9]{32}$/i;

/** Le code d'une demande de connexion par QR, ou null si ce n'est pas un QR de connexion SOS Miam. */
export function lireLienConnexionQr(texte: string): string | null {
  const propre = texte.trim();
  if (CODE.test(propre)) return propre.toLowerCase();
  const trouve = LIEN.exec(propre);
  return trouve ? trouve[1].toLowerCase() : null;
}
