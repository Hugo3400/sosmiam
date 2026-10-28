import type { Langue } from "@sos-miam/commun/regles/langues";
import { formaterIlYA } from "~/fonctions/dates/formater-il-y-a";
import { formaterMomentRelatifLangue } from "~/fonctions/langue/formater-moment-relatif-langue";

const MINUTE_MS = 60_000;
const HEURE_MS = 60 * MINUTE_MS;
const JOUR_MS = 24 * HEURE_MS;

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const compter = (n: number, mot: string) => `${n} ${mot}${n === 1 ? "" : "s"}`;

export function formaterIlYALangue(iso: string, langue: Langue, maintenant: Date = new Date()): { court: string; lu: string } {
  if (langue !== "en") return formaterIlYA(iso, maintenant);
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { court: "", lu: "" };
  const ecoule = maintenant.getTime() - date.getTime();
  if (ecoule < MINUTE_MS) return { court: "just now", lu: "just now" };
  if (ecoule < HEURE_MS) {
    const minutes = Math.floor(ecoule / MINUTE_MS);
    return { court: `${minutes} min ago`, lu: `${compter(minutes, "minute")} ago` };
  }
  const jours = Math.round((debutDuJour(maintenant) - debutDuJour(date)) / JOUR_MS);
  if (jours <= 0) {
    const heures = Math.floor(ecoule / HEURE_MS);
    return { court: `${compter(heures, "hour")} ago`, lu: `${compter(heures, "hour")} ago` };
  }
  if (jours === 1) return { court: "yesterday", lu: "yesterday" };
  return formaterMomentRelatifLangue(iso, langue, maintenant);
}
