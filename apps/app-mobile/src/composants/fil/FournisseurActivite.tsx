import type { ReactNode } from "react";

import { FournisseurActiviteCompte } from "~/composants/fil/FournisseurActiviteCompte";
import { FournisseurActiviteLocale } from "~/composants/fil/FournisseurActiviteLocale";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

/**
 * L'activité de l'app (rescousses de la semaine, lieux gardés, J'aime, « Pas intéressé », lieux et créateurs suivis), lue
 * par utiliserActivite. MODE DÉMO : celle du téléphone, comme avant (FournisseurActiviteLocale). Sinon : celle du compte
 * connecté, sur l'API, et une activité vide sans compte (FournisseurActiviteCompte). Le mode démo ne change qu'en relançant
 * l'app : la source choisie ici reste la même pendant toute la vie de l'app, rien n'est jamais remonté.
 */
export function FournisseurActivite({ children }: { children: ReactNode }) {
  if (DEMO_VISITES_ACTIVE) return <FournisseurActiviteLocale>{children}</FournisseurActiviteLocale>;
  return <FournisseurActiviteCompte>{children}</FournisseurActiviteCompte>;
}
