// Les emoji restent à l'écran mais ne sont pas lus : VoiceOver et TalkBack en diraient le nom (« clin d'œil », « micro »…)
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

/** Texte d'un message du chat prêt à être annoncé au lecteur d'écran : sans ses emoji ni espaces en trop. */
export function retirerEmojiAnnonce(texte: string): string {
  return texte.replace(EMOJI, "").replace(/\s+/g, " ").trim();
}
