// Trouve la commune française qui contient un point, grâce au service public de l'État geo.api.gouv.fr. Rien n'est gardé.
const ADRESSE_GEO = "https://geo.api.gouv.fr/communes";

export type Commune = {
  commune: string;
  departement: string;
  region: string;
};

type ReponseGeo = { nom?: unknown; departement?: { nom?: unknown }; region?: { nom?: unknown } }[];

/** La commune à cette position, ou null hors de France. Lève une erreur si le service ne répond pas (5 s au plus). */
export async function trouverCommune(latitude: number, longitude: number): Promise<Commune | null> {
  const adresse = `${ADRESSE_GEO}?lat=${latitude}&lon=${longitude}&fields=nom,departement,region&format=json`;
  const reponse = await fetch(adresse, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
  if (!reponse.ok) throw new Error(`geo.api.gouv.fr a répondu ${reponse.status}`);
  const communes = (await reponse.json()) as ReponseGeo;
  const premiere = Array.isArray(communes) ? communes[0] : undefined;
  if (!premiere || typeof premiere.nom !== "string") return null;
  const texte = (valeur: unknown) => (typeof valeur === "string" ? valeur : "");
  return { commune: premiere.nom, departement: texte(premiere.departement?.nom), region: texte(premiere.region?.nom) };
}
