const ORIGINE_OPENFREEMAP = "https://tiles.openfreemap.org/";
const CHEMIN_FOND_DE_CARTE = "/fond-de-carte/";

export function reecrireAdresseFondDeCarte(adresse: string, origine: string): string {
  if (!adresse.startsWith(ORIGINE_OPENFREEMAP)) return adresse;
  return `${origine.replace(/\/+$/, "")}${CHEMIN_FOND_DE_CARTE}${adresse.slice(ORIGINE_OPENFREEMAP.length)}`;
}
