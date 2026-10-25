import { choisirLangueAppareil } from "@sos-miam/commun/fonctions/langue/choisir-langue-appareil";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ReglageLangue } from "~/contenus/type-langue";

export function choisirLangueApp(reglage: ReglageLangue, languesTelephone: readonly string[], ouvertes: readonly Langue[], apercu: boolean): Langue {
  if (reglage !== "automatique" && (ouvertes.includes(reglage) || apercu)) return reglage;
  return choisirLangueAppareil(languesTelephone, ouvertes);
}
