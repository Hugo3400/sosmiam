import type { Langue } from "../../regles/langues.ts";

export function citer(texte: string, langue: Langue): string {
  return langue === "en" ? `“${texte}”` : `« ${texte} »`;
}
