// Programme Ambassadeurs (voir docs/decisions.md, « Programme Ambassadeurs » et « Espace ambassadeur »). On n'annonce que
// ce qui est décidé : badges de palier, « Déniché par toi », points, et pour les 10 fondateurs la carte numérotée,
// l'autocollant « Déniché par » à leur prénom, les badges et l'app en avant-première (onglet « Recrutement ambassadeurs »
// du document de Hugo du 7 octobre 2026). Ni avantage chez les commerçants, ni événement, ni groupe, ni rémunération.
// Repris par l'accueil (DevenirAmbassadeur), la page /programme et la carte du palier de l'espace (CartePalier).
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";

/** L'espace ambassadeur (dès 18 ans) : https://ambassadeur.sosmiam.fr, qui mène à /programme. */
export const adresseEspaceAmbassadeur = `https://${HOTE_AMBASSADEUR}`;

// Dans l'ordre : la position du palier donne le niveau de son badge (1 à 4).
export const paliersAmbassadeurs = [
  { titre: "Curieux", seuil: "0 point", texte: "Tout le monde commence ici, les yeux grands ouverts.", sombre: false },
  { titre: "Dénicheur", seuil: "100 points", texte: "Tu as l'œil pour repérer les bonnes adresses.", sombre: false },
  { titre: "Ambassadeur de quartier", seuil: "300 points", texte: "Ton quartier n'a plus de secret pour toi.", sombre: false },
  { titre: "Ambassadeur de ville", seuil: "Sur candidature ou invitation", texte: "Pas une question de points : on candidate, ou l'équipe t'invite.", sombre: true },
];

export const missionsAmbassadeurs = [
  { fort: "Dénicher", suite: "les pépites de ton coin et nous les proposer." },
  { fort: "Tenir à jour", suite: "les fiches des lieux : horaires, plats, nouveautés." },
  { fort: "Valider et créer", suite: "des sélections, comme « Les meilleurs cafés du quartier »." },
  { fort: "En parler", suite: "autour de toi et sur tes réseaux." },
];

export const avantagesAmbassadeurs = [
  { fort: "Un badge", suite: "à chaque niveau passé." },
  { fort: "« Déniché par toi » :", suite: "ton prénom sur la fiche des lieux que tu fais entrer." },
  { fort: "Des points", suite: "pour grimper les niveaux." },
  { fort: "Pour les 10 fondateurs :", suite: "une carte numérotée, ton prénom en vitrine et l'app en avant-première." },
];
