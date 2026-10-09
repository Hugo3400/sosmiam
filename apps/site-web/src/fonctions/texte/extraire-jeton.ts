/**
 * Le jeton d'un lien reçu par mail, tel que la personne l'a collé : le code seul, ou tout le lien (« …#jeton=abc ») ;
 * null s'il n'a pas la forme d'un jeton (16 à 200 lettres, chiffres, « - » ou « _ »).
 */
export function extraireJeton(saisie: string): string | null {
  const texte = saisie.trim();
  const jeton = texte.includes("jeton=") ? texte.slice(texte.lastIndexOf("jeton=") + "jeton=".length) : texte;
  return /^[\w-]{16,200}$/.test(jeton) ? jeton : null;
}
