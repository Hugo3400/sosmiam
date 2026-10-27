import { formaterHeureCourteLangue } from "./formater-heure-courte-langue.ts";

export function formaterHeureCourte(heure: string): string | null {
  return formaterHeureCourteLangue(heure, "fr");
}
