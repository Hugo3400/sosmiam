import type { ChoixGenre } from "@sos-miam/commun/types/genre";

export const TEXTES_GENRE = {
  titre: "Mon genre",
  intro: "Facultatif. Il sert à une seule chose : te montrer les sorties réservées (entre filles, entre garçons, autres genres).",
  personne: "Personne ne le voit : ni les autres Miamis, ni les lieux, ni les sorties où tu vas.",
  legende: "Choisir mon genre",
  regle: "Tu peux le changer une fois par mois, pour que les sorties réservées restent entre les bonnes personnes.",
  bloque: (date: string) => `C'est enregistré. Prochain changement possible le ${date} (une fois par mois).`,
  toujoursPossible: "« Je préfère ne pas le dire » et l'effacement, eux, restent possibles quand tu veux.",
  jamaisTitre: "Ce qu'on ne te demandera jamais",
  jamaisTexte: "Ton orientation. « LGBT+ friendly » est une étiquette de sortie, que chacun peut choisir ou filtrer, pas une case de ton profil.",
  enregistrer: "Enregistrer",
  enregistre: "Enregistré",
  indiceEnregistrer: "Ensuite, un seul changement par mois.",
  annonceEnregistre: "✅ C'est noté, et ça reste entre nous.",
  effacer: "Effacer mon genre",
  effacerTexte: "On ne garde plus ton genre, pas même « Je préfère ne pas le dire » : seulement la date de ton dernier choix, pour la règle d'un changement par mois. Tu vois alors les sorties ouvertes à tous.",
  annonceEfface: "🧽 C'est effacé : on ne garde plus ton genre.",
  rien: "Rien de choisi pour l'instant : tu vois les sorties ouvertes à tous. Et c'est très bien comme ça aussi.",
  envoiRate: "Ça n'est pas parti. Vérifie ta connexion et réessaie dans un instant ?",
  indisponible: "Option en pause jusqu'au prochain changement possible.",
  ligneReglage: "Mon genre",
  ligneSection: "Communauté",
  ligneVide: "Facultatif, et invisible pour les autres",
} as const;

export const OPTIONS_GENRE: readonly { id: ChoixGenre; nom: string; effet: string }[] = [
  { id: "femme", nom: "Femme", effet: "Tu vois aussi les sorties « Entre filles »." },
  { id: "homme", nom: "Homme", effet: "Tu vois aussi les sorties « Entre garçons »." },
  { id: "autre", nom: "Autres", effet: "Tu vois aussi les sorties « Autres genres »." },
  { id: "ne-pas-dire", nom: "Je préfère ne pas le dire", effet: "Tu vois les sorties ouvertes à tous, pas les sorties réservées." },
];
