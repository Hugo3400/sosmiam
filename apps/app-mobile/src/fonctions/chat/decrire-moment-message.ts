import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CHAT_MOMENTS_PAR_LANGUE } from "~/contenus/textes-chat-moments";
import { formaterIlYALangue } from "~/fonctions/langue/formater-il-y-a-langue";

export function decrireMomentMessage(iso: string, heure: string, maintenant: Date, deMoi: boolean, langue: Langue): { vu: string; lu: string } {
  const T = choisirTextes(TEXTES_CHAT_MOMENTS_PAR_LANGUE, langue);
  const moment = formaterIlYALangue(iso, langue, maintenant);
  if (!moment.court) return { vu: heure, lu: heure };
  if (deMoi) return { vu: T.envoyeVu(T.leMoment(moment.court), heure), lu: T.envoyeLu(T.leMoment(moment.lu), heure) };
  return { vu: T.momentVu(moment.court, heure), lu: T.momentLu(moment.lu, heure) };
}
