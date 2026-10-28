import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";

/** Durée d'une note vocale pour le lecteur d'écran : « 12 secondes », « 1 minute », « 1 minute et 5 secondes ». */
export function formaterDureeVocalLue(secondes: number, langue: Langue): string {
  const T = choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue);
  const total = Number.isFinite(secondes) ? Math.max(1, Math.round(secondes)) : 1;
  const minutes = Math.floor(total / 60);
  const reste = total % 60;
  const enSecondes = T.secondes(reste);
  if (minutes === 0) return enSecondes;
  const enMinutes = T.minutes(minutes);
  return reste === 0 ? enMinutes : T.minutesEtSecondes(enMinutes, enSecondes);
}
