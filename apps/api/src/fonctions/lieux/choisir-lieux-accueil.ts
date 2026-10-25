export type CandidatAccueil = { id: number; type: string; ville: string };

export const LIEUX_ACCUEIL = 8;

const QUOTAS: Readonly<Record<string, number>> = { resto: 4, patisserie: 2, bar: 1, sortie: 1 };
const ORDRE_TYPES = ["resto", "patisserie", "bar", "sortie"];

function creerHasard(graine: string): () => number {
  let etat = 2166136261;
  for (const lettre of graine) etat = Math.imul(etat ^ lettre.charCodeAt(0), 16777619);
  return () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function choisirLieuxAccueil(candidats: readonly CandidatAccueil[], enSos: readonly number[], graine: string): number[] {
  const hasard = creerHasard(graine);
  const melanges = candidats.map((candidat) => ({ candidat, tirage: hasard() })).sort((a, b) => a.tirage - b.tirage).map(({ candidat }) => candidat);
  const existants = new Set(candidats.map(({ id }) => id));
  const sos = enSos.filter((id) => existants.has(id)).slice(0, LIEUX_ACCUEIL);
  const pris = new Set(sos);
  const autres: CandidatAccueil[] = [];
  const villes = new Set<string>();
  const parType: Record<string, number> = {};
  const prendre = (candidat: CandidatAccueil) => {
    autres.push(candidat);
    pris.add(candidat.id);
    villes.add(candidat.ville);
    parType[candidat.type] = (parType[candidat.type] ?? 0) + 1;
  };
  for (const villesDifferentes of [true, false]) {
    for (const candidat of melanges) {
      if (sos.length + autres.length >= LIEUX_ACCUEIL) break;
      if (pris.has(candidat.id) || (parType[candidat.type] ?? 0) >= (QUOTAS[candidat.type] ?? 0)) continue;
      if (villesDifferentes && villes.has(candidat.ville)) continue;
      prendre(candidat);
    }
  }
  for (const candidat of [...melanges.filter(({ type }) => type === "resto"), ...melanges]) {
    if (sos.length + autres.length >= LIEUX_ACCUEIL) break;
    if (!pris.has(candidat.id)) prendre(candidat);
  }
  const rang = (type: string) => (ORDRE_TYPES.includes(type) ? ORDRE_TYPES.indexOf(type) : ORDRE_TYPES.length);
  return [...sos, ...autres.sort((a, b) => rang(a.type) - rang(b.type)).map(({ id }) => id)];
}
