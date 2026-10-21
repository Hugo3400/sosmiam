export function lireTypeImage(octets: Uint8Array): "image/png" | "image/jpeg" | null {
  if (octets.length >= 8 && octets[0] === 0x89 && octets[1] === 0x50 && octets[2] === 0x4e && octets[3] === 0x47) return "image/png";
  if (octets.length >= 3 && octets[0] === 0xff && octets[1] === 0xd8 && octets[2] === 0xff) return "image/jpeg";
  return null;
}
