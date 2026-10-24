import { LANGUES, type Langue } from "../../regles/langues.ts";

const FORME = /^([a-z]{2})(?:[-_][a-z0-9]{1,8})*$/i;

export function lireLangue(brut: unknown): Langue | null {
  if (typeof brut !== "string" || brut.length > 35) return null;
  const morceaux = FORME.exec(brut.trim());
  if (!morceaux) return null;
  const code = morceaux[1].toLowerCase();
  return LANGUES.find((langue) => langue === code) ?? null;
}
