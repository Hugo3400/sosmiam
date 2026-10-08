/** Des prénoms à la française : « Inès » ; « Inès et Jade » ; « Inès, Jade et Tom » (rien : « »). */
export function listerPrenoms(prenoms: string[]): string {
  if (prenoms.length <= 1) return prenoms[0] ?? "";
  return `${prenoms.slice(0, -1).join(", ")} et ${prenoms[prenoms.length - 1]}`;
}
