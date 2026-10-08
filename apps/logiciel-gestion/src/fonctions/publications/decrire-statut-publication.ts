import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { Publication } from "~/services/publications.ts";

/** Où en est une publication, en une étiquette : suspendue, programmée, en ligne, brouillon ou masquée. */
export function decrireStatutPublication(publication: Pick<Publication, "statut" | "suspendue" | "publieeLe">, maintenant = new Date()) {
  if (publication.suspendue) return { libelle: "Suspendue (signalement)", ton: "rouge" as const };
  if (publication.statut === "publiee" && publication.publieeLe && new Date(publication.publieeLe) > maintenant) {
    return { libelle: `Programmée le ${formaterDate(publication.publieeLe, true)}`, ton: "jaune" as const };
  }
  if (publication.statut === "publiee") return { libelle: "En ligne", ton: "vert" as const };
  if (publication.statut === "masquee") return { libelle: "Masquée", ton: "rouge" as const };
  return { libelle: "Brouillon", ton: "neutre" as const };
}
