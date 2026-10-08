/** « de » devant un nom, élidé devant une voyelle : « de Léa », mais « d'Inès », « d'Émile » (accents compris). */
export function eliderDe(nom: string): string {
  return /^[aeiouy]/i.test(nom.normalize("NFD")) ? `d'${nom}` : `de ${nom}`;
}
