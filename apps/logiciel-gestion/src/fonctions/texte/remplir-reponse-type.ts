/** Remplace « {prenom} » et « {lieu} » dans une réponse type ; ce qu'on ne connaît pas reste visible, entre crochets. */
export function remplirReponseType(texte: string, valeurs: { prenom?: string | null; lieu?: string | null }): string {
  return texte
    .replace(/\{prenom\}/g, valeurs.prenom?.trim() || "[prénom]")
    .replace(/\{lieu\}/g, valeurs.lieu?.trim() || "[lieu]");
}
