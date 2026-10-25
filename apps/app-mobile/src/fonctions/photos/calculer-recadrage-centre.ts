export type Recadrage = { originX: number; originY: number; width: number; height: number };

export function calculerRecadrageCentre(largeur: number, hauteur: number, rapport: number): Recadrage {
  if (largeur / hauteur > rapport) {
    const width = Math.min(largeur, Math.max(1, Math.round(hauteur * rapport)));
    return { originX: Math.floor((largeur - width) / 2), originY: 0, width, height: hauteur };
  }
  const height = Math.min(hauteur, Math.max(1, Math.round(largeur / rapport)));
  return { originX: 0, originY: Math.floor((hauteur - height) / 2), width: largeur, height };
}
