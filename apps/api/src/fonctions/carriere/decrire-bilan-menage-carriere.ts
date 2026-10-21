import type { BilanMenageCarriere } from "../../services/carriere-regles.ts";

const LIBELLES: Readonly<Record<keyof BilanMenageCarriere, string>> = {
  candidatures: "Candidatures Carrière effacées (6 mois)",
  cv: "CV des candidatures effacés (6 mois)",
  orphelins: "CV orphelins effacés (plus de 24 h)",
  rechiffrees: "Candidatures rechiffrées (changement de clé)",
  illisibles: "Candidatures illisibles pendant le rechiffrement",
};

export function decrireBilanMenageCarriere(bilan: BilanMenageCarriere): [number, string][] {
  return (Object.keys(LIBELLES) as (keyof BilanMenageCarriere)[]).filter((cle) => bilan[cle] > 0).map((cle) => [bilan[cle], LIBELLES[cle]]);
}
