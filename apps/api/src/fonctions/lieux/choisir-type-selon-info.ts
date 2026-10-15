/**
 * Un resto dont l'info commence par « Bar » (« Bar à tapas », « Bar à cocktail », « Bar musical »…) est un bar : la visite
 * sans compte (âge inconnu) est « sans bar ni alcool », et l'app retire les lieux de type « bar » (CLAUDE.md §5, décision de
 * Hugo du 15/10/2026). Restent des restos : « Bar à huîtres », « Bar à fruits », et « Bistrot - Bar à vin » (qui ne commence
 * pas par « Bar » : l'app le cache elle-même sans compte). Les autres types ne changent jamais.
 */
export function choisirTypeSelonInfo<T extends string>(type: T, info: string): T | "bar" {
  const texte = info.trim().toLowerCase();
  if (type !== "resto" || !/^bar\b/.test(texte)) return type;
  return /^bar à (huîtres|huitres|fruits)\b/.test(texte) ? type : "bar";
}
