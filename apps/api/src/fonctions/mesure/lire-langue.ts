/** Langue principale demandée par le navigateur (en-tête Accept-Language) : « fr », « en »… ; null si absente. */
export function lireLangue(acceptLanguage: string | null): string | null {
  const premiere = acceptLanguage?.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  const langue = premiere.split("-")[0] ?? "";
  return /^[a-z]{2,3}$/.test(langue) ? langue : null;
}
