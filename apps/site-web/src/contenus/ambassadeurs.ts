// Programme Ambassadeurs (voir docs/decisions.md, « Programme Ambassadeurs » et « Espace ambassadeur »). On n'annonce que
// ce qui est décidé : badges de palier, « Déniché par toi », points, et pour les fondateurs de chaque ville (367 places en
// France, docs/decisions.md, « Fondateurs par ville ») la carte numérotée, l'autocollant « Déniché par » à leur prénom, les
// badges, l'app en avant-première et une visio d'environ 30 minutes. Ni avantage chez les commerçants, ni événement, ni
// groupe, ni rémunération.
// Repris par l'accueil (DevenirAmbassadeur), la page /programme et la carte du palier de l'espace (CartePalier).
import { accorder } from "../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_AMBASSADEURS_ANGLAIS } from "~/contenus/anglais/ambassadeurs";
import { listerPaliersAmbassadeurs } from "~/fonctions/ambassadeurs/lister-paliers-ambassadeurs";
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";

/** L'espace ambassadeur (dès 18 ans) : https://ambassadeur.sosmiam.fr, qui mène à /programme. */
export const adresseEspaceAmbassadeur = `https://${HOTE_AMBASSADEUR}`;

export const TEXTES_AMBASSADEURS = {
  // Dans l'ordre : la position du palier donne le niveau de son badge (1 à 4). « Ambassadeur de ville » : pas aux points,
  // l'équipe le choisit parmi les fondateurs de sa ville (docs/decisions.md, « Fondateurs par ville »).
  paliers: [
    { titre: "Curieux", texte: "Tout le monde commence ici, les yeux grands ouverts." },
    { titre: "Dénicheur", texte: "Tu as l'œil pour repérer les bonnes adresses." },
    { titre: "Ambassadeur de quartier", texte: "Ton quartier n'a plus de secret pour toi." },
    { titre: "Ambassadeur de ville", texte: "Pas une question de points : l'équipe le choisit parmi les fondateurs de ta ville." },
  ],
  points: (nombre: number) => `${nombre} ${accorder(nombre, "fr", "point", "points")}`,
  nommeParEquipe: "Nommé par l'équipe",
  missions: [
    { fort: "Dénicher", suite: "les pépites de ton coin et nous les proposer." },
    { fort: "Tenir à jour", suite: "les fiches des lieux : horaires, plats, nouveautés." },
    { fort: "Valider et créer", suite: "des sélections, comme « Les meilleurs cafés du quartier »." },
    { fort: "En parler", suite: "autour de toi et sur tes réseaux." },
  ],
  avantages: [
    { fort: "Un badge", suite: "à chaque niveau passé." },
    { fort: "« Déniché par toi » :", suite: "ton prénom sur la fiche des lieux que tu fais entrer." },
    { fort: "Des points", suite: "pour grimper les niveaux." },
    { fort: "Pour les fondateurs de chaque ville :", suite: "une carte numérotée, ton prénom en vitrine et l'app en avant-première." },
  ],
};

export const TEXTES_AMBASSADEURS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_AMBASSADEURS>> = {
  fr: TEXTES_AMBASSADEURS,
  en: TEXTES_AMBASSADEURS_ANGLAIS,
};

export const paliersAmbassadeurs = listerPaliersAmbassadeurs(TEXTES_AMBASSADEURS);
