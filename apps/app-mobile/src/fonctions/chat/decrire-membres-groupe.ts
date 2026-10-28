import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";

export function decrireMembresGroupe(nombre: number, createur: string | null, langue: Langue): string {
  const T = choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue);
  const membres = T.membres(nombre);
  return createur ? T.creePar(membres, createur) : membres;
}
