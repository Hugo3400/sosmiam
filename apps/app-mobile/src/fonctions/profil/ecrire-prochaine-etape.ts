import type { ProgressionAmbassadeur } from "@sos-miam/commun/types/ambassadeur";
import { TEXTES_PALIER } from "~/contenus/textes-profil";

export function ecrireProchaineEtape({ suivant, reste }: ProgressionAmbassadeur): string {
  if (!suivant) return TEXTES_PALIER.toutEnHaut;
  return reste === null ? TEXTES_PALIER.nommeParLEquipe(suivant.nom) : TEXTES_PALIER.plusQue(reste, suivant.nom);
}
