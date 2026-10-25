import { ecrireAdresseLieu } from "~/fonctions/lieux/ecrire-adresse-lieu";
import type { FichePublique } from "~/types/pro";

export function creerLienItineraire(lieu: Pick<FichePublique, "nom" | "adresse" | "quartier" | "ville">): string {
  const destination = [lieu.nom, lieu.adresse?.trim() ? ecrireAdresseLieu(lieu) : lieu.ville].join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
