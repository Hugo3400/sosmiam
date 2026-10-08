// Position du téléphone au moment de valider une visite (ou de signaler sa présence), et verdict comparé au lieu.

/** Lecture de la position du téléphone, envoyée dans le corps d'un POST au moment de valider ; jamais gardée ni écrite dans un journal */
export type LecturePosition = {
  latitude: number;
  longitude: number;
  /** Rayon d'incertitude en mètres (coords.accuracy) ; null si le téléphone ne le donne pas */
  precision: number | null;
  /** Âge de la lecture au moment de l'envoi (Date.now() − coords.timestamp), mesuré par le téléphone */
  ageMs: number;
  /** coords.mocked (Android) ; false quand le téléphone ne dit rien (iOS) */
  simulee: boolean;
};

export type ResultatPosition = "dans-rayon" | "hors-rayon" | "imprecise" | "perimee" | "simulee";

/** distanceM sert seulement au message « environ 1,2 km » ; jamais gardée */
export type EvaluationPosition = { resultat: ResultatPosition; distanceM: number };
