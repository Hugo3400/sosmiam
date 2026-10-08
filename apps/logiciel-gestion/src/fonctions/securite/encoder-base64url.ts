/** Encode des octets en base64url (sans « = »), le format des clés et signatures échangées avec l'API. */
export function encoderBase64Url(octets: Uint8Array): string {
  let binaire = "";
  for (const octet of octets) binaire += String.fromCharCode(octet);
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
