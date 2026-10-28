import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { nommerJourLangue } from "@sos-miam/commun/fonctions/langue/nommer-jour-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CHAT_MOMENTS_PAR_LANGUE } from "~/contenus/textes-chat-moments";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Le jour écrit au-dessus des messages d'une discussion : « Aujourd'hui », « Hier », « Lundi 6 octobre »
 * (avec l'année si ce n'est pas celle-ci : « Lundi 6 octobre 2025 »).
 */
export function decrireJourDiscussion(date: Date, maintenant: Date, langue: Langue): string {
  const T = choisirTextes(TEXTES_CHAT_MOMENTS_PAR_LANGUE, langue);
  // Arrondi : un changement d'heure (été, hiver) donne des journées de 23 ou 25 heures
  const ecart = Math.round((debutDuJour(maintenant) - debutDuJour(date)) / 86_400_000);
  if (ecart <= 0) return T.aujourdhui;
  if (ecart === 1) return T.hier;
  const jour = nommerJourLangue(date.getDay(), langue);
  const longue = ecrireDateLongueLangue(formaterDateIso(date), langue);
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} ${date.getFullYear() === maintenant.getFullYear() ? longue.replace(/ \d+$/, "") : longue}`;
}
