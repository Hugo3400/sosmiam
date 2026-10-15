const MOTS_ALCOOL = /\b(bars?|bières?|bieres?|vins?|alcools?|cocktails?|ap[ée]ros?|whisky|rhum|vodka|pintes?|happy[ -]hour|spiritueux|champagne|ivresse|cuite)\b/i;

export function parleDAlcool(texte: string): boolean {
  return MOTS_ALCOOL.test(texte);
}
