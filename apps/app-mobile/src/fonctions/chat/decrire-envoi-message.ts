import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CHAT_MOMENTS_PAR_LANGUE } from "~/contenus/textes-chat-moments";
import { formaterIlYALangue } from "~/fonctions/langue/formater-il-y-a-langue";

export function decrireEnvoiMessage(iso: string, maintenant: Date, langue: Langue): { vu: string; lu: string } {
  const T = choisirTextes(TEXTES_CHAT_MOMENTS_PAR_LANGUE, langue);
  const moment = formaterIlYALangue(iso, langue, maintenant);
  if (!moment.court) return { vu: T.envoye, lu: T.envoye };
  return { vu: T.envoyeDepuisVu(moment.court), lu: T.envoyeDepuisLu(T.leMoment(moment.lu)) };
}
