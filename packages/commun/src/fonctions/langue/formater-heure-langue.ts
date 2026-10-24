import type { Langue } from "../../regles/langues.ts";

const INSECABLE = " ";

export function formaterHeureLangue(heures: number, minutes: number, langue: Langue, options: { espacee?: boolean } = {}): string {
  const mm = String(minutes).padStart(2, "0");
  if (langue === "en") return `${String(heures).padStart(2, "0")}:${mm}`;
  const espace = options.espacee ? INSECABLE : "";
  const heure = `${heures}${espace}h`;
  return minutes === 0 ? heure : `${heure}${espace}${mm}`;
}
