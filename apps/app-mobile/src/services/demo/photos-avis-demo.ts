const PHOTOS_MAX = 20;

const photos = new Map<string, string>();

function trouverAdresse(fichier: Blob | ArrayBuffer | Uint8Array): string | null {
  const uri = (fichier as { uri?: unknown }).uri;
  if (typeof uri === "string") return uri;
  if (typeof Blob === "undefined" || !(fichier instanceof Blob) || typeof URL.createObjectURL !== "function") return null;
  try {
    return URL.createObjectURL(fichier);
  } catch {
    return null;
  }
}

export function retenirPhotoAvisDemo(nom: string, fichier: Blob | ArrayBuffer | Uint8Array): void {
  const adresse = trouverAdresse(fichier);
  if (!adresse) return;
  photos.set(nom, adresse);
  if (photos.size > PHOTOS_MAX) {
    const plusAncienne = photos.keys().next().value;
    if (plusAncienne !== undefined) photos.delete(plusAncienne);
  }
}

export function lirePhotoAvisDemo(nom: string): string | null {
  return photos.get(nom) ?? null;
}
