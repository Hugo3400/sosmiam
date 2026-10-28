import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { formaterMomentRelatif } from "~/fonctions/dates/formater-moment-relatif";

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export function formaterMomentRelatifLangue(iso: string, langue: Langue, maintenant: Date = new Date()): { court: string; lu: string } {
  if (langue !== "en") return formaterMomentRelatif(iso, maintenant);
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { court: "", lu: "" };
  const { jours, joursCourts, mois, moisCourts } = CALENDRIER_PAR_LANGUE.en;
  const ecart = Math.round((debutDuJour(maintenant) - debutDuJour(date)) / 86_400_000);
  if (ecart <= 0) {
    const heure = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return { court: heure, lu: `today at ${heure}` };
  }
  if (ecart === 1) return { court: "Yesterday", lu: "yesterday" };
  if (ecart < 7) return { court: joursCourts[date.getDay()], lu: jours[date.getDay()] };
  const annee = date.getFullYear() === maintenant.getFullYear() ? "" : ` ${date.getFullYear()}`;
  return { court: `${date.getDate()} ${moisCourts[date.getMonth()]}${annee}`, lu: `${date.getDate()} ${mois[date.getMonth()]}${annee}` };
}
