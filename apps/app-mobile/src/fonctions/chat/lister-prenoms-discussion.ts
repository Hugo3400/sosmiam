import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Pote } from "@sos-miam/commun/types/potes";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";

/** Les membres d'une conversation de groupe, toi à la fin : « Léa, Karim, Tom et toi » (« Toi » si tu es tout seul). */
export function listerPrenomsDiscussion(membres: Pote[], langue: Langue): string {
  const T = choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue);
  const prenoms = membres.map((p) => p.prenom);
  return prenoms.length === 0 ? T.toi : T.prenomsEtToi(prenoms.join(", "));
}
