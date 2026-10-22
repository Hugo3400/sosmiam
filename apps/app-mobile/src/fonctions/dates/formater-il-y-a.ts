import { formaterMomentRelatif } from "~/fonctions/dates/formater-moment-relatif";

const MINUTE_MS = 60_000;
const HEURE_MS = 60 * MINUTE_MS;
const JOUR_MS = 24 * HEURE_MS;

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const compter = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export function formaterIlYA(iso: string, maintenant: Date = new Date()): { court: string; lu: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { court: "", lu: "" };
  const ecoule = maintenant.getTime() - date.getTime();
  if (ecoule < MINUTE_MS) return { court: "à l'instant", lu: "à l'instant" };
  if (ecoule < HEURE_MS) {
    const minutes = Math.floor(ecoule / MINUTE_MS);
    return { court: `il y a ${minutes} min`, lu: `il y a ${compter(minutes, "minute")}` };
  }
  const jours = Math.round((debutDuJour(maintenant) - debutDuJour(date)) / JOUR_MS);
  if (jours <= 0) {
    const heures = Math.floor(ecoule / HEURE_MS);
    return { court: `il y a ${heures} h`, lu: `il y a ${compter(heures, "heure")}` };
  }
  if (jours === 1) return { court: "hier", lu: "hier" };
  return formaterMomentRelatif(iso, maintenant);
}
