const HOTES_PERMIS = /^(?:media\d?\.giphy\.com|i\.giphy\.com)$/;
const LONGUEUR_MAX_ADRESSE = 400;

export function lireAdresseGifPermise(brut: unknown): string | null {
  if (typeof brut !== "string" || brut.length === 0 || brut.length > LONGUEUR_MAX_ADRESSE) return null;
  let adresse: URL;
  try {
    adresse = new URL(brut);
  } catch {
    return null;
  }
  if (adresse.protocol !== "https:" || adresse.port !== "" || adresse.username !== "" || adresse.password !== "") return null;
  if (!HOTES_PERMIS.test(adresse.hostname)) return null;
  return adresse.href.length <= LONGUEUR_MAX_ADRESSE ? adresse.href : null;
}
