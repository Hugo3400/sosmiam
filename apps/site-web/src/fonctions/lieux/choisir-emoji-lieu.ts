const EMOJIS_ALCOOL = new Set(["🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🍾", "🍶", "🧉"]);
const EMOJI_AMBIANCE = "🎶";

export function choisirEmojiLieu(emoji: string): string {
  return EMOJIS_ALCOOL.has(emoji.replace(/️/g, "")) ? EMOJI_AMBIANCE : emoji;
}
