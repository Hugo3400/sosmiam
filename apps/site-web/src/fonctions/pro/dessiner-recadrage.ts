import type { Cadre } from "../../types/images-lieu.ts";

const FOND_OPAQUE = "#FFFFFF";

export function dessinerRecadrage(toile: HTMLCanvasElement, source: CanvasImageSource, cadre: Cadre, opaque: boolean): void {
  const contexte = toile.getContext("2d");
  if (!contexte) return;
  contexte.clearRect(0, 0, toile.width, toile.height);
  if (opaque) {
    contexte.fillStyle = FOND_OPAQUE;
    contexte.fillRect(0, 0, toile.width, toile.height);
  }
  contexte.imageSmoothingEnabled = true;
  contexte.imageSmoothingQuality = "high";
  contexte.drawImage(source, cadre.x, cadre.y, cadre.largeur, cadre.hauteur, 0, 0, toile.width, toile.height);
}
