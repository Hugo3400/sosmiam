import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ResumeAvis } from "@sos-miam/commun/types/avis";

import { TEXTES_AVIS_LIEU } from "~/contenus/textes-avis-lieu";

const T = TEXTES_AVIS_LIEU;

const ecrireDecimal = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");

export function ecrireResumeAvis(resume: ResumeAvis): { visible: string; lu: string } | null {
  if (resume.nombre === 0 || resume.moyenne === null) return null;
  const moyenne = ecrireDecimal(resume.moyenne);
  const nombre = resume.nombre === 1 ? T.resumeUnAvis : remplirModele(T.resumeAvis, { nombre: String(resume.nombre) });
  const retour = resume.partRetour === null ? null : remplirModele(T.resumeRetour, { part: String(Math.round(resume.partRetour * 100)) });
  const visible = [remplirModele(T.resumeMoyenne, { moyenne }), nombre, retour].filter(Boolean).join(" · ");
  const lu = [remplirModele(T.resumeLu, { moyenne, nombre }), retour].filter(Boolean).join(". ");
  return { visible, lu };
}
