import { SOURCES_LIEUX } from "../../contenus/sources-lieux.ts";
import type { SourceLieu } from "../../types/source-lieu.ts";

const ADRESSES = /https?:\/\/[^\s)<>"']+/gi;

const lireHote = (adresse: string): string | null => {
  try {
    return new URL(adresse).hostname.toLowerCase();
  } catch {
    return null;
  }
};

export function lireSourceLieu(note: string | null | undefined): SourceLieu | null {
  if (!note) return null;
  for (const adresse of note.match(ADRESSES) ?? []) {
    const hote = lireHote(adresse);
    if (!hote) continue;
    const source = SOURCES_LIEUX.find((s) => hote === s.hote || hote.endsWith(`.${s.hote}`));
    if (source) {
      const { hote: _hote, ...publique } = source;
      return publique;
    }
  }
  return null;
}
