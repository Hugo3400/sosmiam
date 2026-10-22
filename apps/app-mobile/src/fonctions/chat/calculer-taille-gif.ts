const RATIO_MIN = 0.6;
const RATIO_MAX = 2.2;

export function calculerTailleGif(gif: { largeur: number; hauteur: number }, largeur: number): { largeur: number; hauteur: number } {
  const ratio = gif.largeur > 0 && gif.hauteur > 0 ? Math.min(RATIO_MAX, Math.max(RATIO_MIN, gif.largeur / gif.hauteur)) : 1;
  return { largeur: Math.round(largeur), hauteur: Math.round(largeur / ratio) };
}
