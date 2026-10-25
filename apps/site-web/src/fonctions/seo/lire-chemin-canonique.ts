export function lireCheminCanonique(correspondances: readonly { loaderData?: unknown }[]): string | null {
  for (const { loaderData } of [...correspondances].reverse()) {
    if (typeof loaderData !== "object" || loaderData === null || !("cheminCanonique" in loaderData)) continue;
    const { cheminCanonique } = loaderData;
    if (typeof cheminCanonique === "string" && cheminCanonique.startsWith("/")) return cheminCanonique;
  }
  return null;
}
