import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ResumeAvis } from "@sos-miam/commun/types/avis";

import { TEXTES_AVIS_LIEU_PAR_LANGUE } from "~/contenus/textes-avis-lieu";

const ecrireDecimal = (n: number, langue: Langue) => {
  const arrondi = String(Math.round(n * 10) / 10);
  return langue === "en" ? arrondi : arrondi.replace(".", ",");
};

export function ecrireResumeAvis(resume: ResumeAvis, langue: Langue): { visible: string; lu: string } | null {
  const T = choisirTextes(TEXTES_AVIS_LIEU_PAR_LANGUE, langue);
  if (resume.nombre === 0 || resume.moyenne === null) return null;
  const moyenne = ecrireDecimal(resume.moyenne, langue);
  const nombre = resume.nombre === 1 ? T.resumeUnAvis : remplirModele(T.resumeAvis, { nombre: String(resume.nombre) });
  const retour = resume.partRetour === null ? null : remplirModele(T.resumeRetour, { part: String(Math.round(resume.partRetour * 100)) });
  const visible = [remplirModele(T.resumeMoyenne, { moyenne }), nombre, retour].filter(Boolean).join(" · ");
  const lu = [remplirModele(T.resumeLu, { moyenne, nombre }), retour].filter(Boolean).join(". ");
  return { visible, lu };
}
