const EMPREINTE = /^[0-9A-F]{2}(?::[0-9A-F]{2}){31}$/;

/**
 * Les empreintes SHA-256 du certificat de l'app Android, lues dans SOS_MIAM_ANDROID_SHA256 : une ou plusieurs (séparées
 * par des virgules : la clé d'envoi et celle de Google Play, par exemple), au format « AB:CD:… » (32 octets) ou en 64
 * caractères hexadécimaux collés. Ce qui n'a pas cette forme est écarté ; rien de bon : liste vide.
 */
export function lireEmpreintesAndroid(brut: string | undefined): string[] {
  const empreintes = (brut ?? "")
    .split(",")
    .map((morceau) => morceau.trim().toUpperCase())
    .map((morceau) => (/^[0-9A-F]{64}$/.test(morceau) ? morceau.match(/../g)!.join(":") : morceau))
    .filter((morceau) => EMPREINTE.test(morceau));
  return [...new Set(empreintes)];
}
