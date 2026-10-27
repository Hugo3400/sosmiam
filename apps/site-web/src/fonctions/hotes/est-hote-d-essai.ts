const HOTES_D_ESSAI = ["apercu.sosmiam.fr", "localhost", "127.0.0.1", "pro.localhost"];

export function estHoteDEssai(hote: string): boolean {
  const nomHote = hote.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  return HOTES_D_ESSAI.includes(nomHote);
}
