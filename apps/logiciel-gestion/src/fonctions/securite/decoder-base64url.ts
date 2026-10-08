/** Décode du base64url (avec ou sans « = ») en octets. */
export function decoderBase64Url(texte: string): Uint8Array<ArrayBuffer> {
  const base64 = texte.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(texte.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (caractere) => caractere.charCodeAt(0));
}
