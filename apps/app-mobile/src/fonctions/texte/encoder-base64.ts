const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function encoderBase64(octets: Uint8Array): string {
  const morceaux: string[] = [];
  for (let i = 0; i < octets.length; i += 3) {
    const a = octets[i]!;
    const b = octets[i + 1];
    const c = octets[i + 2];
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    morceaux.push(ALPHABET[(n >> 18) & 63]! + ALPHABET[(n >> 12) & 63]! + (b === undefined ? "=" : ALPHABET[(n >> 6) & 63]!) + (c === undefined ? "=" : ALPHABET[n & 63]!));
  }
  return morceaux.join("");
}
