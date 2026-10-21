const LIENS_STORES = {
  ios: "https://apps.apple.com/app/id6820551130",
  android: "https://play.google.com/store/apps/details?id=fr.sosmiam.app",
} as const;

export function choisirLienStore(plateforme: unknown): string | null {
  return plateforme === "ios" || plateforme === "android" ? LIENS_STORES[plateforme] : null;
}
