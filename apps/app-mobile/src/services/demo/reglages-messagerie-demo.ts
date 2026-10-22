import type { Desabonner } from "@sos-miam/commun/client-api/reponse-api";
import type { ReglagesMessagerie } from "@sos-miam/commun/types/social";

const PAR_DEFAUT: ReglagesMessagerie = { accusesLecture: true, apercuMessages: true };

let reglages: ReglagesMessagerie = PAR_DEFAUT;
const ecouteurs = new Set<() => void>();

export function lireReglagesMessagerieDemo(): ReglagesMessagerie {
  return reglages;
}

export function changerReglagesMessagerieDemo(p: Partial<ReglagesMessagerie>): void {
  reglages = { ...reglages, ...p };
  ecouteurs.forEach((ecouteur) => {
    try {
      ecouteur();
    } catch {
      return;
    }
  });
}

export function ecouterReglagesMessagerieDemo(fn: () => void): Desabonner {
  ecouteurs.add(fn);
  return () => {
    ecouteurs.delete(fn);
  };
}
