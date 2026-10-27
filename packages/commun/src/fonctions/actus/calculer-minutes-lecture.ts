import { MOTS_LUS_PAR_MINUTE } from "../../regles/actus.ts";

export function calculerMinutesLecture(paragraphes: readonly string[]): number {
  const mots = paragraphes.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(mots / MOTS_LUS_PAR_MINUTE));
}
