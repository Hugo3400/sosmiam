/** Âge en années révolues à une date donnée, à partir d'une date de naissance « AAAA-MM-JJ ». */
export function calculerAge(dateNaissance: string, aujourdhui: Date = new Date()): number {
  const [annee, mois, jour] = dateNaissance.split("-").map(Number);
  let age = aujourdhui.getFullYear() - annee;
  const anniversairePasse = aujourdhui.getMonth() + 1 > mois || (aujourdhui.getMonth() + 1 === mois && aujourdhui.getDate() >= jour);
  if (!anniversairePasse) age -= 1;
  return age;
}
