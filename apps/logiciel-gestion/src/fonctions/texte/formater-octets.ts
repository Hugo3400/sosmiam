const UNITES = ["o", "Ko", "Mo", "Go", "To"];

/** Taille lisible : 512 o, 3,4 Mo, 1,2 Go. */
export function formaterOctets(octets: number): string {
  let valeur = octets;
  let rang = 0;
  while (valeur >= 1024 && rang < UNITES.length - 1) {
    valeur /= 1024;
    rang++;
  }
  return `${valeur.toLocaleString("fr-FR", { maximumFractionDigits: rang === 0 ? 0 : 1 })} ${UNITES[rang]}`;
}
