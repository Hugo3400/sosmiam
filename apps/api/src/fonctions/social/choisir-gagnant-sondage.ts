export function choisirGagnantSondage(ordres: readonly number[], votes: readonly { ordre: number }[]): { ordre: number; voix: number } | null {
  let gagnant: { ordre: number; voix: number } | null = null;
  for (const ordre of [...new Set(ordres)].sort((a, b) => a - b)) {
    const voix = votes.filter((v) => v.ordre === ordre).length;
    if (voix > 0 && (!gagnant || voix > gagnant.voix)) gagnant = { ordre, voix };
  }
  return gagnant;
}
