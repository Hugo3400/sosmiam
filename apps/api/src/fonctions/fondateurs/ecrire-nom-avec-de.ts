// Article des noms d'après l'Insee (Code officiel géographique, champ TNCC « type de nom en clair ») :
// 0 pas d'article (consonne), 1 pas d'article (voyelle ou h muet), 2 « le », 3 « la », 4 « les », 5 « l' »,
// 6 « aux », 7 « las », 8 « los ».

/**
 * Le nom précédé de « de », contracté comme il faut, pour la carte de fondateur (« Fondateur n° 3 de Lyon ») :
 * « de Lyon », « d'Angers », « du Havre », « de La Rochelle », « des Abymes », « de la Creuse », « des Landes »,
 * « de l'Ain », « de La Réunion », « de Polynésie française ».
 *
 * `nom` est le nom sans son article (champ NCCENR de l'Insee). Pour une commune, l'article fait partie du nom officiel
 * et garde sa majuscule (`articleDansLeNom` : « de La Rochelle ») ; pour un département, non (« de la Creuse »).
 */
export function ecrireNomAvecDe(nom: string, tncc: number, articleDansLeNom: boolean): string {
  const article = (mot: string) => (articleDansLeNom ? mot[0].toUpperCase() + mot.slice(1) : mot);
  switch (tncc) {
    case 0:
      return `de ${nom}`;
    case 1:
      return `d'${nom}`;
    case 2:
      return `du ${nom}`;
    case 3:
      return `de ${article("la")} ${nom}`;
    case 4:
    case 6:
      return `des ${nom}`;
    case 5:
      return `de ${article("l'")}${nom}`;
    case 7:
      return `de ${article("las")} ${nom}`;
    case 8:
      return `de ${article("los")} ${nom}`;
    default:
      throw new Error(`Type de nom de l'Insee inconnu (TNCC ${tncc}) pour « ${nom} »`);
  }
}
