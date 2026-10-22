import type { GifApi } from "@sos-miam/commun/types/messagerie";

export const GIFS_DEMO: readonly (GifApi & { mots: readonly string[] })[] = [
  { id: "demoMiam01", url: "exemple:😋", largeur: 240, hauteur: 180, mots: ["miam", "trop bon"] },
  { id: "demoFaim02", url: "exemple:🤤", largeur: 200, hauteur: 250, mots: ["j'ai faim", "faim", "miam"] },
  { id: "demoMerci03", url: "exemple:🙏", largeur: 240, hauteur: 160, mots: ["merci", "trop gentil"] },
  { id: "demoGoGo04", url: "exemple:🏃", largeur: 220, hauteur: 220, mots: ["on y va", "go", "j'arrive"] },
  { id: "demoFete05", url: "exemple:🎉", largeur: 240, hauteur: 200, mots: ["fete", "bravo", "on y va"] },
  { id: "demoPizza06", url: "exemple:🍕", largeur: 200, hauteur: 260, mots: ["miam", "pizza", "faim"] },
  { id: "demoCoeur07", url: "exemple:🥰", largeur: 240, hauteur: 190, mots: ["merci", "amour"] },
  { id: "demoChef08", url: "exemple:👨‍🍳", largeur: 210, hauteur: 240, mots: ["chef", "cuisine", "miam"] },
];
