import { MIN_DUREE_SONDAGE_MINUTES } from "@sos-miam/commun/regles/chat";
import { formaterHeure } from "~/fonctions/dates/formater-heure";

export type FinSondage = { cle: "1h" | "3h" | "ce-soir"; libelle: string; date: Date; heure: string };

const MINUTE_MS = 60_000;
const HEURE_DU_SOIR = 19;
const MARGE_ENVOI_MINUTES = 2;
const heureDe = (date: Date) => formaterHeure(`${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`);

export function calculerFinsSondage(maintenant: Date): FinSondage[] {
  const dans = (minutes: number) => new Date(maintenant.getTime() + minutes * MINUTE_MS);
  const fins: Omit<FinSondage, "heure">[] = [
    { cle: "1h", libelle: "Dans 1 h", date: dans(60) },
    { cle: "3h", libelle: "Dans 3 h", date: dans(180) },
  ];
  const soir = new Date(maintenant);
  soir.setHours(HEURE_DU_SOIR, 0, 0, 0);
  if (soir.getTime() - maintenant.getTime() >= (MIN_DUREE_SONDAGE_MINUTES + MARGE_ENVOI_MINUTES) * MINUTE_MS) fins.push({ cle: "ce-soir", libelle: "Ce soir 19 h", date: soir });
  return fins.map((f) => ({ ...f, heure: heureDe(f.date) }));
}
