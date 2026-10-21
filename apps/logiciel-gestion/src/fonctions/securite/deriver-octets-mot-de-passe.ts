export async function deriverOctetsMotDePasse(motDePasse: string, sel: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array<ArrayBuffer>> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(motDePasse.normalize("NFC")), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sel, iterations }, base, 256));
}
