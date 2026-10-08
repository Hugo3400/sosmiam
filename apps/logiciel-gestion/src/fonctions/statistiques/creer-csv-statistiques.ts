import type { Statistiques } from "~/services/statistiques.ts";

const proteger = (valeur: string | number) => {
  const texte = String(valeur);
  return /[";\n]|^[=+\-@]/.test(texte) ? `"${texte.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : texte;
};

/** Les statistiques affichées, en CSV pour un tableur (« ; ») : une ligne par période, puis chaque classement. */
export function creerCsvStatistiques(statistiques: Statistiques, nomsDimensions: Record<string, string>): string {
  const lignes: (string | number)[][] = [
    ["periode", "debut", "fin", "visiteurs", "visites", "pages_vues", "visites_finies", "rebonds", "duree_visites_s", "temps_reponse_ms", "inscriptions", "demandes_lieux"],
  ];
  for (const periode of statistiques.periodes) {
    const conversions = statistiques.conversions.find((c) => c.cle === periode.cle);
    lignes.push([
      periode.cle, periode.debut, periode.fin, periode.visiteurs, periode.visites, periode.vues, periode.visitesFinies,
      periode.rebonds, periode.dureeVisites, periode.tempsMoyen ?? "", conversions?.inscriptions ?? 0, conversions?.demandes ?? 0,
    ]);
  }
  for (const [dimension, classement] of Object.entries(statistiques.details)) {
    if (!classement?.length) continue;
    lignes.push([], [nomsDimensions[dimension] ?? dimension, "nombre"]);
    for (const { valeur, nombre } of classement) lignes.push([valeur, nombre]);
  }
  return `﻿${lignes.map((ligne) => ligne.map(proteger).join(";")).join("\r\n")}\r\n`;
}
