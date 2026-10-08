/** Empreinte SHA-256 d'octets, en hexadécimal (celle du corps de chaque demande signée). */
export async function calculerEmpreinteSha256(octets: Uint8Array<ArrayBuffer>): Promise<string> {
  const empreinte = new Uint8Array(await crypto.subtle.digest("SHA-256", octets));
  return Array.from(empreinte, (octet) => octet.toString(16).padStart(2, "0")).join("");
}
