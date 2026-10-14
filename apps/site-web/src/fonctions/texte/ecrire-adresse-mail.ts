// Aucun import ici : le test (tests/mon-compte.test.ts) lance ce fichier directement avec Node.

/** Une adresse « mailto: » avec l'objet et le texte déjà remplis (encodés : accents, espaces et retours à la ligne). */
export function ecrireAdresseMail(email: string, mail: { objet: string; texte: string }): string {
  return `mailto:${email}?subject=${encodeURIComponent(mail.objet)}&body=${encodeURIComponent(mail.texte)}`;
}
