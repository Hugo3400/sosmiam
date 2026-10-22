import type { GifApi } from "../../../../../packages/commun/src/types/messagerie.ts";

export function ecrireGifMessage(gif: GifApi): string {
  return JSON.stringify({ i: gif.id, u: gif.url, l: gif.largeur, h: gif.hauteur });
}
