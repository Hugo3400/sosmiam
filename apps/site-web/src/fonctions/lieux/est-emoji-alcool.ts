const EMOJIS_ALCOOL = new Set(["🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🍾", "🍶", "🧉"]);

export function estEmojiAlcool(emoji: string): boolean {
  return EMOJIS_ALCOOL.has(emoji.replace(/️/g, ""));
}
