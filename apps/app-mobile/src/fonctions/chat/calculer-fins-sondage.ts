import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { MIN_DUREE_SONDAGE_MINUTES } from "@sos-miam/commun/regles/chat";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CHAT_MOMENTS_PAR_LANGUE } from "~/contenus/textes-chat-moments";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";

export type FinSondage = { cle: "1h" | "3h" | "ce-soir"; libelle: string; date: Date; heure: string };

const MINUTE_MS = 60_000;
const HEURE_DU_SOIR = 19;
const MARGE_ENVOI_MINUTES = 2;

export function calculerFinsSondage(maintenant: Date, langue: Langue): FinSondage[] {
  const T = choisirTextes(TEXTES_CHAT_MOMENTS_PAR_LANGUE, langue);
  const dans = (minutes: number) => new Date(maintenant.getTime() + minutes * MINUTE_MS);
  const fins: Omit<FinSondage, "heure">[] = [
    { cle: "1h", libelle: T.finDans1h, date: dans(60) },
    { cle: "3h", libelle: T.finDans3h, date: dans(180) },
  ];
  const soir = new Date(maintenant);
  soir.setHours(HEURE_DU_SOIR, 0, 0, 0);
  if (soir.getTime() - maintenant.getTime() >= (MIN_DUREE_SONDAGE_MINUTES + MARGE_ENVOI_MINUTES) * MINUTE_MS) fins.push({ cle: "ce-soir", libelle: T.finCeSoir, date: soir });
  return fins.map((f) => ({ ...f, heure: ecrireHeureLangue(f.date, langue) }));
}
