const FINS_DE_LIGNE = /\r\n?|[\v\f\u0085\u2028\u2029]/g;

export function nettoyerTexteSocial(texte: string): string {
  return texte.replace(FINS_DE_LIGNE, "\n").trim();
}
