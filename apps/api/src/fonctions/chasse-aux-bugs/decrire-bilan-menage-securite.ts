import type { BilanMenageSecurite } from "../../services/securite-regles.ts";

const LIBELLES: Readonly<Record<keyof BilanMenageSecurite, string>> = {
  signalements: "Signalements de sécurité effacés (2 ans après clôture)",
  images: "Captures des signalements effacées (2 ans)",
  orphelines: "Captures orphelines effacées (plus de 24 h)",
  rechiffres: "Signalements de sécurité rechiffrés (changement de clé)",
  illisibles: "Signalements illisibles pendant le rechiffrement",
};

export function decrireBilanMenageSecurite(bilan: BilanMenageSecurite): [number, string][] {
  return (Object.keys(LIBELLES) as (keyof BilanMenageSecurite)[]).filter((cle) => bilan[cle] > 0).map((cle) => [bilan[cle], LIBELLES[cle]]);
}
