/** Prénom trop long ou absent : la signature garde 40 caractères (la taille du prénom d'un compte) */
const PRENOM_MAX = 40;

/**
 * La signature figée d'un avis : « Léa M. » pour qui a donné son nom, « Léa » sinon. Sans prénom lisible : « Quelqu'un ».
 */
export function signerAvis(prenom: string, initialeNom: string | null): string {
  const propre = prenom.trim().replace(/\s+/g, " ").slice(0, PRENOM_MAX).trim() || "Quelqu'un";
  const initiale = initialeNom?.trim().charAt(0).toLocaleUpperCase("fr-FR") ?? "";
  return initiale !== "" ? `${propre} ${initiale}.` : propre;
}
