const FIN_DE_PHRASE = /[.!?…:]$/;

export function enchainerPhrases(morceaux: (string | null | undefined)[]): string {
  return morceaux
    .map((m) => m?.trim())
    .filter((m): m is string => !!m)
    .reduce((texte, morceau) => (!texte ? morceau : `${texte}${FIN_DE_PHRASE.test(texte) ? "" : "."} ${morceau}`), "");
}
