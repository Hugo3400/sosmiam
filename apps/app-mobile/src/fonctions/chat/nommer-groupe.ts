import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";

/**
 * Le nom d'un groupe à l'écran : son titre, ou « Groupe » quand il n'en a pas (titre illisible, ou effacé par la
 * modération). Dans une phrase, ne mettre les guillemets qu'autour d'un vrai titre.
 */
export function nommerGroupe(titre: string | null | undefined, langue: Langue): string {
  return titre?.trim() || choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue).groupe;
}
