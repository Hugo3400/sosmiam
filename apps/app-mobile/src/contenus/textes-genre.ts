import type { ChoixGenre } from "@sos-miam/commun/types/genre";

export const TEXTES_GENRE = {
  titre: "Mon genre",
  intro: "Facultatif. Il sert à une seule chose : te montrer les sorties réservées (entre filles, entre garçons, autres genres). Personne ne le voit : ni les autres Miamis, ni les lieux.",
  regle: "Tu peux le changer une fois par mois, pour que les sorties réservées restent entre les bonnes personnes.",
  bloque: (date: string) => `C'est enregistré. Prochain changement possible le ${date} (une fois par mois).`,
  jamaisTitre: "Ce qu'on ne te demandera jamais",
  jamaisTexte: "Ton orientation. « LGBT+ friendly » est une étiquette de sortie, que chacun peut choisir ou filtrer, pas une case de ton profil.",
  enregistrer: "Enregistrer",
  enregistre: "Enregistré",
  ligneReglage: "Mon genre",
  ligneSection: "Communauté",
  ligneVide: "Facultatif, et invisible pour les autres",
} as const;

export const OPTIONS_GENRE: readonly { id: ChoixGenre; nom: string; effet: string }[] = [
  { id: "femme", nom: "Femme", effet: "Tu vois aussi les sorties « Entre filles »." },
  { id: "homme", nom: "Homme", effet: "Tu vois aussi les sorties « Entre garçons »." },
  { id: "autre", nom: "Autres", effet: "Tu vois aussi les sorties « Autres genres »." },
  { id: "ne-pas-dire", nom: "Je préfère ne pas dire", effet: "Tu vois les sorties ouvertes à tous, pas les sorties réservées." },
];
