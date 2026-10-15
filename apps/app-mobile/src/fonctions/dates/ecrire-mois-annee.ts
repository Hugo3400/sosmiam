const NOMS_DES_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export function ecrireMoisAnnee(mois: string): string {
  const [annee, numero] = mois.split("-").map(Number);
  const nom = NOMS_DES_MOIS[numero - 1];
  return nom && Number.isInteger(annee) ? `${nom} ${annee}` : mois;
}
