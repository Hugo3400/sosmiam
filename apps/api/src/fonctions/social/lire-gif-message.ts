import { FORME_ID_GIF } from "../../../../../packages/commun/src/regles/chat.ts";
import type { GifApi } from "../../../../../packages/commun/src/types/messagerie.ts";
import { lireAdresseGifPermise } from "../gif/lire-adresse-gif-permise.ts";

const estCote = (brut: unknown): brut is number => typeof brut === "number" && Number.isInteger(brut) && brut >= 1 && brut <= 4096;

export function lireGifMessage(clair: string): GifApi | null {
  let lu: unknown;
  try {
    lu = JSON.parse(clair);
  } catch {
    return null;
  }
  if (typeof lu !== "object" || lu === null) return null;
  const { i, u, l, h } = lu as { i?: unknown; u?: unknown; l?: unknown; h?: unknown };
  const url = lireAdresseGifPermise(u);
  if (typeof i !== "string" || !FORME_ID_GIF.test(i) || !url || !estCote(l) || !estCote(h)) return null;
  return { id: i, url, largeur: l, hauteur: h };
}
