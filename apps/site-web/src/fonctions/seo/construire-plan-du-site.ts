// Aucun import « ~/… » ici : le test (tests/plan-du-site.test.ts) lance ce fichier directement avec Node.

/** Une adresse du plan, avec sa dernière modification si on la connaît (date ISO 8601) */
export type AdressePlan = { adresse: string; modifieLe?: string };

const ECHAPPEMENTS: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const echapper = (texte: string) => texte.replace(/[&<>"']/g, (caractere) => ECHAPPEMENTS[caractere] ?? caractere);

/**
 * Le XML de /sitemap.xml (protocole sitemaps.org) : une balise <url> par adresse, avec <lastmod> quand la date est lisible
 * (écrite au format W3C, à la seconde, en heure universelle).
 */
export function construirePlanDuSite(adresses: AdressePlan[]): string {
  const lignes = adresses.map(({ adresse, modifieLe }) => {
    const moment = modifieLe === undefined ? Number.NaN : Date.parse(modifieLe);
    const lastmod = Number.isNaN(moment) ? "" : `<lastmod>${new Date(moment).toISOString().replace(/\.\d{3}Z$/, "Z")}</lastmod>`;
    return `  <url><loc>${echapper(adresse)}</loc>${lastmod}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lignes.join("\n")}\n</urlset>\n`;
}
