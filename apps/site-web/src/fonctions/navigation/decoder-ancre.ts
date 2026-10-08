/** Décode une ancre d'URL ; une ancre mal encodée (« % » isolé…) est rendue telle quelle au lieu de faire planter la page. */
export function decoderAncre(brut: string): string {
  try {
    return decodeURIComponent(brut);
  } catch {
    return brut;
  }
}
