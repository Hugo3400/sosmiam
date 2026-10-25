const IMAGE_LIEU = /^\/app\/lieux\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$/i;

export function lireImageLieu(adresse: unknown): string | null {
  return typeof adresse === "string" && IMAGE_LIEU.test(adresse) ? adresse : null;
}
