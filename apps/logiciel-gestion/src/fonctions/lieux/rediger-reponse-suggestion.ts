/**
 * La réponse proposée à l'auteur d'une modification de fiche, selon la décision : tout appliqué, une partie (les champs
 * gardés sont nommés), ou rien (avec des [crochets] pour dire pourquoi). Hugo la relit et la change avant l'envoi.
 */
export function redigerReponseSuggestion({ prenom, lieu, champsAppliques, total }: { prenom: string | null; lieu: string; champsAppliques: string[]; total: number }): string {
  const bonjour = prenom ? `Salut ${prenom} !` : "Salut !";
  const fin = "À bientôt,\nHugo, pour SOS Miam";
  if (champsAppliques.length === 0) {
    return `${bonjour}\n\nMerci pour ta suggestion pour ${lieu}, on l'a bien regardée. Pour l'instant, on garde la fiche telle quelle : [dis pourquoi en une phrase].\n\n${fin}`;
  }
  if (champsAppliques.length < total) {
    const liste = champsAppliques.map((champ) => champ.toLowerCase()).join(", ");
    return `${bonjour}\n\nMerci pour ta suggestion pour ${lieu} ! On a mis à jour : ${liste}. Pour le reste, on garde la fiche telle quelle pour l'instant.\n\n${fin}`;
  }
  return `${bonjour}\n\nMerci pour ta suggestion pour ${lieu} : c'est à jour sur SOS Miam. Grâce à toi, la fiche est nickel 🛟\n\n${fin}`;
}
