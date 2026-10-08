/** Les pseudos mentionnés avec « @ » dans un texte (sans doublon, sans le « @ »). */
export function extraireMentions(texte: string): string[] {
  const trouves = [...texte.matchAll(/@([a-z0-9][a-z0-9._]{1,18}[a-z0-9])/gi)].map((m) => m[1].toLowerCase());
  return [...new Set(trouves)];
}
