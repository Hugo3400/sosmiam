export type InscritListe = { adresse: string; ville: string; telephone: string; beta: string };
export type FiltresInscrits = { ville: string | null; candidats: boolean; beta: boolean; telephone: "" | "iphone" | "android" };

const meme = (a: string, b: string) => a.trim().localeCompare(b.trim(), "fr", { sensitivity: "base" }) === 0;

/**
 * Les inscrits de la liste qui correspondent aux filtres choisis dans le logiciel (ville, candidats ambassadeurs, bêta-
 * testeurs, téléphone), sans doublon. `candidats` : les adresses qui ont coché « ambassadeur fondateur » (dans la base).
 */
export function filtrerInscrits(liste: InscritListe[], filtres: FiltresInscrits, candidats: Set<string>): InscritListe[] {
  const vus = new Set<string>();
  return liste.filter((inscrit) => {
    if (vus.has(inscrit.adresse)) return false;
    if (filtres.ville && !meme(inscrit.ville, filtres.ville)) return false;
    if (filtres.candidats && !candidats.has(inscrit.adresse)) return false;
    if (filtres.beta && inscrit.beta !== "oui") return false;
    if (filtres.telephone && inscrit.telephone !== filtres.telephone) return false;
    vus.add(inscrit.adresse);
    return true;
  });
}
