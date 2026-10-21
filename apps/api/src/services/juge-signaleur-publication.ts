import { peutMasquerToutDeSuite } from "../fonctions/social/peut-masquer-tout-de-suite.ts";
import type { CompteLu } from "./comptes.ts";
import type { ServicesLimitations } from "./limitations-comptes-regles.ts";

export type JugeSignaleurPublication = (compteId: number) => Promise<boolean>;

export function creerJugeSignaleurPublication(
  lireCompte: (id: number) => Promise<CompteLu | null>,
  estLimite: ServicesLimitations["estLimite"] | undefined,
  horloge: () => number,
): JugeSignaleurPublication {
  return async (compteId) => {
    const maintenant = new Date(horloge());
    const [compte, limite] = await Promise.all([lireCompte(compteId), estLimite ? estLimite(compteId, maintenant) : null]);
    if (!compte || limite !== null) return false;
    return peutMasquerToutDeSuite({ emailVerifie: compte.emailVerifie, creeLe: new Date(compte.creeLe) }, false, maintenant);
  };
}
