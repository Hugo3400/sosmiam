import { lireCleSuivi } from "~/fonctions/suivi/lire-cle-suivi";

export function lirePersonneSuivie(cle: string): string | undefined {
  const cible = lireCleSuivi(cle);
  return cible?.type === "personne" ? cible.id : undefined;
}
