const noms = new Intl.DisplayNames(["fr"], { type: "region" });

/** Nom d'un pays d'après son code Cloudflare (« FR » → « France »). Codes spéciaux : XX inconnu, T1 Tor. */
export function nommerPays(code: string): string {
  if (code === "XX" || code === "Inconnu") return "Inconnu";
  if (code === "T1") return "Réseau Tor";
  try {
    return noms.of(code) ?? code;
  } catch {
    return code;
  }
}
