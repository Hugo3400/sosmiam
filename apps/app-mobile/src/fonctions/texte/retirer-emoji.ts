// Les emoji restent à l'écran mais ne sont pas lus : VoiceOver et TalkBack en diraient le nom (« cœur jaune », « ciseaux »…)
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

/** Texte prêt pour le lecteur d'écran (libellé ou annonce) : sans ses emoji ni espaces en trop. */
export function retirerEmoji(texte: string): string {
  return texte.replace(EMOJI, "").replace(/\s+/g, " ").trim();
}
