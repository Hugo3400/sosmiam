export const TEXTES_CARTE_LIEU = {
  sos: (places: number) => `SOS ce soir · ${places} ${places > 1 ? "places" : "place"}`,
  verifie: "✓ Vérifié",
  nonVerifie: "Non vérifié",
  denichePar: (prenom: string) => `Déniché par ${prenom}`,
} as const;
