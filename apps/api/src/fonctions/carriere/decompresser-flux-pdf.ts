import { constants, inflateRawSync } from "node:zlib";

function aUneEnteteZlib(octets: Uint8Array): boolean {
  if (octets.length < 2) return false;
  const methode = octets[0]!;
  const drapeaux = octets[1]!;
  return (methode & 0x0f) === 8 && methode >> 4 <= 7 && ((methode << 8) | drapeaux) % 31 === 0 && (drapeaux & 0x20) === 0;
}

export function decompresserFluxPdf(octets: Uint8Array, plafond: number): Buffer | null {
  if (plafond < 1) return null;
  try {
    return inflateRawSync(aUneEnteteZlib(octets) ? octets.subarray(2) : octets, { maxOutputLength: plafond, finishFlush: constants.Z_SYNC_FLUSH });
  } catch {
    return null;
  }
}
