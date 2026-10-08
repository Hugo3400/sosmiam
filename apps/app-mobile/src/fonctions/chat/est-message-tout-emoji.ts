const PICTOGRAMME = /\p{Extended_Pictographic}/gu;
const LETTRE_DRAPEAU = /\p{Regional_Indicator}/gu;
// Rien d'autre que des emoji (avec leurs variantes, couleurs de peau, drapeaux et liaisons) et des espaces
const TOUT_EMOJI = /^(?:[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\u{FE0F}\u{200D}]|\s)+$/u;

/** Vrai pour un message fait d'un à trois emoji seulement (« 😋 », « 🔥🔥 », « 🇮🇹 ») : il s'affiche alors en grand, sans bulle. */
export function estMessageToutEmoji(texte: string): boolean {
  const propre = texte.trim();
  if (propre === "" || !TOUT_EMOJI.test(propre)) return false;
  // Un drapeau s'écrit avec deux lettres-drapeaux
  const nombre = (propre.match(PICTOGRAMME)?.length ?? 0) + Math.ceil((propre.match(LETTRE_DRAPEAU)?.length ?? 0) / 2);
  return nombre >= 1 && nombre <= 3;
}
