import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_RECHERCHE_COMMUNE } from "~/contenus/recherche-commune";
import type { ResultatRecherche } from "~/types/compte";

type MessageRecherche = Extract<ResultatRecherche, { etat: "message" }>;

export function ecrireMessageRecherche(resultat: MessageRecherche, textes: Traduction<typeof TEXTES_RECHERCHE_COMMUNE>): string {
  return resultat.code === "introuvable" ? textes.messages.introuvable(resultat.recherche) : textes.messages[resultat.code];
}
