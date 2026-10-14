/**
 * La page d'où l'on arrive, réduite au site (« https://www.google.com/search?q=… » → « https://www.google.com ») : l'API
 * n'en garde que le nom du site (apps/api/src/fonctions/mesure/nettoyer-provenance.ts), le reste ne part pas. Les
 * applications Android gardent leur nom (« android-app://com.google.android.gm »). Illisible ou absente : null.
 */
export function reduireReferent(referent: string | null): string | null {
  if (!referent) return null;
  try {
    const url = new URL(referent);
    return url.host ? `${url.protocol}//${url.host}` : null;
  } catch {
    return null;
  }
}
