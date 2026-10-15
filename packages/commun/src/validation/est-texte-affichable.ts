// Au moins un caractère qui se voit : ni une espace (insécables comprises, U+00A0 et U+202F), ni un contrôle (\p{Cc}), ni
// un format invisible (\p{Cf} : U+200B, le joint U+200D des emoji, le sens d'écriture, le trait d'union conditionnel), ni un
// caractère ignorable (sélecteurs de variante U+FE0F, remplissages coréens U+3164), ni le braille vide (U+2800). Les emoji
// composés restent visibles : « 👩‍🍳 » sans son joint, c'est encore 👩 et 🍳.
const VISIBLE = /[^\s\p{Cc}\p{Cf}\p{Default_Ignorable_Code_Point}⠀]/u;
// Les caractères de contrôle C0 et C1 (\p{Cc}), sauf la tabulation et le retour à la ligne : un octet nul, un retour chariot
// ou une séquence d'échappement n'ont rien à faire dans un message. La tabulation passe : elle passait déjà, l'app la garde
// quand on colle un texte venu d'ailleurs, et elle s'affiche comme une espace
const CONTROLE_INTERDIT = /(?![\t\n])\p{Cc}/u;

/**
 * Vrai si le texte peut s'afficher tel quel : au moins un caractère visible, et aucun caractère de contrôle à part la
 * tabulation et le retour à la ligne. Pour les textes de la partie sociale (verifierTexteSocial) et ceux des signalements ;
 * même verdict sous Node (l'API) et sous Hermes (l'app).
 */
export function estTexteAffichable(texte: string): boolean {
  return VISIBLE.test(texte) && !CONTROLE_INTERDIT.test(texte);
}
