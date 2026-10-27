import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_MESSAGE_COMPTE_LIMITE_PAR_LANGUE } from "../../contenus/message-compte-limite.ts";
import { ecrireDateAParisLangue } from "../dates/ecrire-date-a-paris-langue.ts";

const HEURE_PARIS = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** La fin d'une limitation en mots : « jusqu'au 22 octobre 2026 à 12 h », ou « jusqu'à nouvel ordre » (fin null ou illisible). */
export function decrireFinLimitation(fin: string | null | undefined, langue: Langue = LANGUE_PAR_DEFAUT): string {
  const T = choisirTextes(TEXTES_MESSAGE_COMPTE_LIMITE_PAR_LANGUE, langue);
  const jour = fin ? ecrireDateAParisLangue(fin, langue) : null;
  if (!fin || !jour) return T.nouvelOrdre;
  const [heures, minutes] = HEURE_PARIS.format(new Date(fin)).split(":").map(Number);
  return T.jusquAu(jour, T.heure(heures, minutes));
}
