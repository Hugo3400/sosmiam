export function formaterPourcentage(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("fr-FR")} %`;
}
