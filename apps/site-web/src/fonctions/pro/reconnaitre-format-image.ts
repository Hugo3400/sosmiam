export const TYPES_IMAGE_SOURCE = ["image/jpeg", "image/png", "image/webp"] as const;

export type FormatImageSource = (typeof TYPES_IMAGE_SOURCE)[number];

const commencePar = (octets: Uint8Array, signature: readonly number[], depart = 0) => signature.every((octet, rang) => octets[depart + rang] === octet);

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

export function reconnaitreFormatImage(tete: Uint8Array): FormatImageSource | null {
  if (commencePar(tete, JPEG)) return "image/jpeg";
  if (commencePar(tete, PNG)) return "image/png";
  if (commencePar(tete, RIFF) && commencePar(tete, WEBP, 8)) return "image/webp";
  return null;
}
