import type { FichePublique } from "~/types/pro";

export function ecrireAdresseLieu(lieu: Pick<FichePublique, "adresse" | "quartier" | "ville">): string {
  const adresse = lieu.adresse?.trim();
  if (!adresse) return [lieu.quartier, lieu.ville].filter(Boolean).join(", ");
  return adresse.toLowerCase().includes(lieu.ville.toLowerCase()) ? adresse : `${adresse}, ${lieu.ville}`;
}
