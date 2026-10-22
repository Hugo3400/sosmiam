import { FORME_ID_GIF } from "../../../../../packages/commun/src/regles/chat.ts";
import type { GifApi } from "../../../../../packages/commun/src/types/messagerie.ts";
import { lireAdresseGifPermise } from "./lire-adresse-gif-permise.ts";

const RENDUS_PREFERES = ["fixed_width_downsampled", "fixed_width"] as const;
const COTE_MAX = 4096;

const lireCote = (brut: unknown): number | null => {
  const nombre = typeof brut === "number" ? brut : typeof brut === "string" && /^\d{1,5}$/.test(brut) ? Number(brut) : Number.NaN;
  return Number.isInteger(nombre) && nombre >= 1 && nombre <= COTE_MAX ? nombre : null;
};

export function choisirRenduGif(brut: unknown): GifApi | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { id, images } = brut as { id?: unknown; images?: unknown };
  if (typeof id !== "string" || !FORME_ID_GIF.test(id) || typeof images !== "object" || images === null) return null;
  for (const nom of RENDUS_PREFERES) {
    const rendu = (images as Record<string, unknown>)[nom];
    if (typeof rendu !== "object" || rendu === null) continue;
    const { url, webp, width, height } = rendu as Record<string, unknown>;
    const adresse = lireAdresseGifPermise(webp) ?? lireAdresseGifPermise(url);
    const largeur = lireCote(width);
    const hauteur = lireCote(height);
    if (adresse && largeur && hauteur) return { id, url: adresse, largeur, hauteur };
  }
  return null;
}
