import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";

export async function calculerIdClientReponse(origine: string): Promise<string> {
  const h = await digestStringAsync(CryptoDigestAlgorithm.SHA256, origine);
  const variante = "89ab"[parseInt(h[16]!, 16) & 3];
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variante}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
