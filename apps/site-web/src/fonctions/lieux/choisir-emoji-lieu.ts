import { estEmojiAlcool } from "./est-emoji-alcool.ts";

const EMOJI_AMBIANCE = "🎶";

export function choisirEmojiLieu(emoji: string): string {
  return estEmojiAlcool(emoji) ? EMOJI_AMBIANCE : emoji;
}
