/** Même longueur que l'avatar du profil (colonne de 16 caractères) */
const LONGUEUR_MAX_EMOJI = 16;
// Un drapeau (deux indicateurs régionaux), ou un pictogramme suivi de ses variantes (VS16, teinte de peau), de ses liaisons
// (ZWJ : 👩‍🍳) et de ses étiquettes (drapeaux de régions). La même règle avec ou sans Intl.Segmenter (l'API sous Node comme
// l'app sous Hermes) : un indicateur régional seul (« 🇫 »), la forme texte (« ❤︎ », U+FE0E) ou un accent combinant ne
// passent nulle part
const UN_EMOJI =
  /^(?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}[\u{FE0F}\u{1F3FB}-\u{1F3FF}]*(?:\u{200D}\p{Extended_Pictographic}[\u{FE0F}\u{1F3FB}-\u{1F3FF}]*)*[\u{E0020}-\u{E007F}]*)$/u;

let segmenteur: Intl.Segmenter | null = null;

/** Nombre de « lettres » à l'écran ; null si le moteur ne sait pas les compter */
function compterGraphemes(texte: string): number | null {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") return null;
  segmenteur ??= new Intl.Segmenter("fr", { granularity: "grapheme" });
  return [...segmenteur.segment(texte)].length;
}

/**
 * Vrai si le texte est un seul emoji : une seule « lettre » à l'écran, un pictogramme (avec ses variantes) ou un drapeau,
 * 16 caractères au plus. Même verdict sur tous les moteurs, avec ou sans Intl.Segmenter (qui ne sert qu'à vérifier en
 * plus qu'il n'y a qu'une lettre). Pour l'emoji d'une sortie, d'une liste ou d'un groupe, déjà nettoyé avec trim par
 * l'appelant : « 🍕 » avec une espace autour n'en est pas un.
 */
export function estEmojiSeul(texte: unknown): texte is string {
  if (typeof texte !== "string" || texte === "" || texte.length > LONGUEUR_MAX_EMOJI) return false;
  if (!UN_EMOJI.test(texte)) return false;
  const graphemes = compterGraphemes(texte);
  return graphemes === null || graphemes === 1;
}
