import type { PalierAmbassadeur } from "../types/ambassadeur";

// Programme Ambassadeurs (voir docs/decisions.md) : une seule progression, une seule monnaie, les points.

/** Les paliers, dans l'ordre. Le dernier se fait sur candidature ou invitation. */
export const PALIERS_AMBASSADEUR: readonly PalierAmbassadeur[] = [
  { cle: "curieux", nom: "Curieux", emoji: "👀", seuil: 0 },
  { cle: "denicheur", nom: "Dénicheur", emoji: "🔎", seuil: 100 },
  { cle: "ambassadeur-quartier", nom: "Ambassadeur de quartier", emoji: "🏘️", seuil: 300 },
  { cle: "ambassadeur-ville", nom: "Ambassadeur de ville", emoji: "🎖️", seuil: null },
];

/** Points gagnés pour chaque action (barème décidé le 8 octobre 2026). */
export const POINTS_AMBASSADEUR = {
  visite: 15,
  visiteSos: 25,
  avisPhoto: 10,
  proposerLieu: 30,
  corrigerFiche: 5,
  premierSauveteur: 20,
  rescousse: 2,
} as const;
