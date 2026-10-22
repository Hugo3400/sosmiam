import type { GifApi } from "@sos-miam/commun/types/messagerie";
import { calculerTailleGif } from "~/fonctions/chat/calculer-taille-gif";

export function repartirGifsColonnes(gifs: readonly GifApi[], largeurColonne: number, ecart = 0): [GifApi[], GifApi[]] {
  const colonnes: [GifApi[], GifApi[]] = [[], []];
  const hauteurs = [0, 0];
  for (const gif of gifs) {
    const i = hauteurs[1] < hauteurs[0] ? 1 : 0;
    colonnes[i].push(gif);
    hauteurs[i] += calculerTailleGif(gif, largeurColonne).hauteur + ecart;
  }
  return colonnes;
}
