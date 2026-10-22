import { AESEncryptionKey, AESSealedData, aesDecryptAsync } from "expo-crypto";

import { decoderUtf8 } from "~/fonctions/texte/decoder-utf8";

const CONTEXTE_BASE64 = "c29zLW1pYW0vYXBlcmN1L3Yx";
const TITRE_MAX = 120;
const TEXTE_MAX = 400;

export async function dechiffrerApercu(chiffre: string, cleBase64: string): Promise<{ titre: string; texte: string } | null> {
  try {
    const cle = await AESEncryptionKey.import(cleBase64, "base64");
    const scelle = AESSealedData.fromCombined(chiffre, { ivLength: 12, tagLength: 16 });
    const octets = await aesDecryptAsync(scelle, cle, { additionalData: CONTEXTE_BASE64 });
    const json = decoderUtf8(octets);
    if (json === null) return null;
    const lu: unknown = JSON.parse(json);
    if (typeof lu !== "object" || lu === null) return null;
    const { t, c } = lu as Record<string, unknown>;
    if (typeof t !== "string" || typeof c !== "string" || !t || !c) return null;
    return { titre: t.slice(0, TITRE_MAX), texte: c.slice(0, TEXTE_MAX) };
  } catch {
    return null;
  }
}
