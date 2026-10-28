import type { CategorieFacultative } from "~/contenus/cookies-consentement";
import type { ChoixConsentement } from "~/types/consentement";

export function doitAfficherInformation(aChoisir: CategorieFacultative[], choix: ChoixConsentement | null): boolean {
  return aChoisir.length === 0 && choix === null;
}
