// Coordonnées d'une adresse, par le service public de géocodage de l'IGN (Géoplateforme, base adresse nationale).
// Seulement des adresses de lieux (pas de données personnelles) ; rien n'est gardé.
const ADRESSE_SERVICE = "https://data.geopf.fr/geocodage/search";

export type ResultatGeocodage = { libelle: string; nom: string; ville: string; codePostal: string; latitude: number; longitude: number; score: number };

export async function chercherAdresse(adresse: string): Promise<ResultatGeocodage[]> {
  const url = `${ADRESSE_SERVICE}?${new URLSearchParams({ q: adresse, limit: "5" })}`;
  const reponse = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "sos-miam-gestion" } });
  if (!reponse.ok) throw new Error(`géocodage indisponible (${reponse.status})`);
  const corps = (await reponse.json()) as {
    features?: { geometry?: { coordinates?: [number, number] }; properties?: { label?: string; name?: string; city?: string; postcode?: string; score?: number } }[];
  };
  return (corps.features ?? [])
    .filter((f) => f.geometry?.coordinates && f.properties?.label)
    .map((f) => ({
      libelle: f.properties!.label!,
      nom: f.properties!.name ?? f.properties!.label!,
      ville: f.properties!.city ?? "",
      codePostal: f.properties!.postcode ?? "",
      longitude: f.geometry!.coordinates![0],
      latitude: f.geometry!.coordinates![1],
      score: Math.round((f.properties!.score ?? 0) * 100) / 100,
    }));
}
