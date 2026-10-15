// Les fins de ligne de Windows (\r\n) et des vieux Mac (\r) : l'app ne les change pas quand on colle un texte venu
// d'ailleurs, elles deviennent un simple retour à la ligne
const FINS_DE_LIGNE = /\r\n?/g;

/**
 * Un texte de la partie sociale tel qu'on le vérifie (verifierTexteSocial) et tel qu'on le garde : fins de ligne \r\n et
 * \r changées en \n, puis trim. Sans lui, un message collé depuis un ordinateur serait refusé pour son \r (caractère de
 * contrôle : voir estTexteAffichable).
 */
export function nettoyerTexteSocial(texte: string): string {
  return texte.replace(FINS_DE_LIGNE, "\n").trim();
}
