// Les 18 régions de France (celles de villes-france.ts), chacune dans un rectangle qui la contient : de quoi cadrer une
// carte sur « ta région ». Coins approximatifs, arrondis au dixième de degré vers l'extérieur (quelques km de marge).

/** Rectangle en degrés : latitudes nord et sud, longitudes ouest et est */
export type ZoneGeo = { nord: number; sud: number; ouest: number; est: number };

export const regionsFrance: Readonly<Record<string, ZoneGeo>> = {
  "Auvergne-Rhône-Alpes": { nord: 46.9, sud: 44.1, ouest: 2.0, est: 7.2 },
  "Bourgogne-Franche-Comté": { nord: 48.5, sud: 46.1, ouest: 2.8, est: 7.2 },
  Bretagne: { nord: 48.9, sud: 47.2, ouest: -5.2, est: -1.0 },
  "Centre-Val de Loire": { nord: 49.0, sud: 46.3, ouest: 0.0, est: 3.2 },
  Corse: { nord: 43.1, sud: 41.3, ouest: 8.5, est: 9.6 },
  "Grand Est": { nord: 50.2, sud: 47.4, ouest: 3.3, est: 8.3 },
  "Hauts-de-France": { nord: 51.1, sud: 48.8, ouest: 1.3, est: 4.3 },
  "Île-de-France": { nord: 49.3, sud: 48.1, ouest: 1.4, est: 3.6 },
  Normandie: { nord: 50.1, sud: 48.1, ouest: -2.0, est: 1.9 },
  "Nouvelle-Aquitaine": { nord: 47.2, sud: 42.7, ouest: -1.8, est: 2.7 },
  Occitanie: { nord: 45.1, sud: 42.3, ouest: -0.4, est: 4.9 },
  "Pays de la Loire": { nord: 48.6, sud: 46.2, ouest: -2.7, est: 1.0 },
  "Provence-Alpes-Côte d'Azur": { nord: 45.2, sud: 42.9, ouest: 4.2, est: 7.8 },
  Guadeloupe: { nord: 16.6, sud: 15.8, ouest: -61.9, est: -61.0 },
  Martinique: { nord: 14.9, sud: 14.3, ouest: -61.3, est: -60.8 },
  Guyane: { nord: 5.8, sud: 2.1, ouest: -54.7, est: -51.6 },
  "La Réunion": { nord: -20.8, sud: -21.4, ouest: 55.2, est: 55.9 },
  Mayotte: { nord: -12.6, sud: -13.1, ouest: 45.0, est: 45.4 },
};

/** La France métropolitaine (Corse comprise), pour « toute la France » */
export const FRANCE_METROPOLITAINE: ZoneGeo = { nord: 51.1, sud: 41.3, ouest: -5.2, est: 9.6 };
