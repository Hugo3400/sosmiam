import type { DocumentLegal, SectionLegale } from "~/contenus/legal/type-legal";

export type ChapitreAffiche = { id: string; numero: number; titre: string; sections: SectionLegale[] };

/**
 * Les chapitres d'une page légale, avec leurs sections (sommaire et texte se construisent à partir d'ici).
 * Lève une erreur si un chapitre cite une section inconnue, ou si une section n'est dans aucun chapitre ou dans deux,
 * ou dans le désordre : rien ne doit disparaître de la page (vérifié aussi par tests/pages-legales.test.ts).
 */
export function regrouperEnChapitres(document: Pick<DocumentLegal, "titre" | "sections" | "chapitres">): ChapitreAffiche[] {
  const parId = new Map(document.sections.map((section) => [section.id, section]));
  const ordre = document.chapitres.flatMap((chapitre) => chapitre.sections);
  const attendu = document.sections.map((section) => section.id);
  if (ordre.join("|") !== attendu.join("|")) {
    throw new Error(`« ${document.titre} » : les chapitres doivent citer chaque section une fois, dans l'ordre (${attendu.join(", ")}).`);
  }
  return document.chapitres.map((chapitre, i) => ({
    id: chapitre.id,
    numero: i + 1,
    titre: chapitre.titre,
    sections: chapitre.sections.map((id) => parId.get(id) as SectionLegale),
  }));
}
