import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";

export type FormeDateCourriel = "jour" | "echeance" | "moment";

const LOCALES: Record<Langue, string> = { fr: "fr-FR", en: "en-GB" };

const OPTIONS: Record<FormeDateCourriel, Intl.DateTimeFormatOptions> = {
  jour: { day: "numeric", month: "long", year: "numeric" },
  echeance: { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" },
  moment: { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" },
};

export function formaterDateCourriel(date: Date, forme: FormeDateCourriel, langue: Langue): string {
  return new Intl.DateTimeFormat(LOCALES[langue], { ...OPTIONS[forme], timeZone: "Europe/Paris", ...(langue === "en" ? { hourCycle: "h23" as const } : {}) }).format(date);
}
