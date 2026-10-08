/** Le lien du QR de vitrine d'un lieu : « https://sosmiam.fr/l/<code public> ». Il ouvre la fiche, il ne valide rien. */
export function construireLienLieu(codePublic: string): string {
  return `https://sosmiam.fr/l/${codePublic}`;
}
