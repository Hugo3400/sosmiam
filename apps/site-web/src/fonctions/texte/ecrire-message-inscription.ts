import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { ReponseInscription } from "~/composants/accueil/Inscription";
import type { TEXTES_INSCRIPTION_NEWSLETTER } from "~/contenus/inscription-newsletter";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function ecrireMessageInscription(reponse: ReponseInscription, textes: Traduction<typeof TEXTES_INSCRIPTION_NEWSLETTER>): string {
  if (!reponse.ok) return lierPonctuation(textes.erreurs[reponse.erreur]);
  const suites = [reponse.beta ? textes.suiteBeta : "", reponse.ambassadeur ? textes.suiteAmbassadeur : ""].filter(Boolean);
  return lierPonctuation([textes.confirmation(textes.ou(reponse.lieu)), ...suites].join(" "));
}
