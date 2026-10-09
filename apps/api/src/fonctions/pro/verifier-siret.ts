/** SIREN de La Poste : ses établissements ne suivent pas la clé de Luhn, mais une règle à elle (somme des chiffres multiple de 5) */
const SIREN_LA_POSTE = "356000000";

/**
 * Vrai si c'est un numéro SIRET possible : 14 chiffres (espaces déjà retirés) dont la clé de Luhn est juste (en partant
 * de la droite, un chiffre sur deux est doublé, 9 retiré au-delà de 9 ; le total est un multiple de 10). Exception
 * prévue par l'Insee : les établissements de La Poste (SIREN 356 000 000), dont la somme des chiffres est un multiple de 5.
 * Ne dit pas que l'entreprise existe : seulement que le numéro n'est pas mal tapé.
 */
export function verifierSiret(siret: string): boolean {
  if (!/^\d{14}$/.test(siret)) return false;
  const chiffres = [...siret].map(Number);
  if (siret.startsWith(SIREN_LA_POSTE) && siret !== "35600000000048") {
    return chiffres.reduce((total, chiffre) => total + chiffre, 0) % 5 === 0;
  }
  const total = chiffres.reduceRight((somme, chiffre, index) => {
    const double = (chiffres.length - 1 - index) % 2 === 1 ? chiffre * 2 : chiffre;
    return somme + (double > 9 ? double - 9 : double);
  }, 0);
  return total % 10 === 0;
}
