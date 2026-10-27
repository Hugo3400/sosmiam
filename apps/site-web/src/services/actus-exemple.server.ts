import type { ArticleActus, AuteurActus, LieuCiteActus, StatutArticleActus } from "../../../../packages/commun/src/types/actus.ts";
import type { TypeLieu } from "../../../../packages/commun/src/types/lieu.ts";

export type ArticleActusExemple = ArticleActus<null> & { statut: StatutArticleActus };

const ZOE: AuteurActus = { id: 9101, prenom: "zoe.croque", avatar: "miami:beret", ambassadeur: true };
const MALO: AuteurActus = { id: 9102, prenom: "malo.matelot", avatar: "miami:binocles", ambassadeur: true };
const INES: AuteurActus = { id: 9103, prenom: "ines.papilles", avatar: "miami:chantilly", ambassadeur: true };
const SAMI: AuteurActus = { id: 9104, prenom: "sami.tartine", avatar: "miami:bob", ambassadeur: true };

const lieu = (id: number, nom: string, type: TypeLieu, emoji: string, quartier: string, ville: string, verifie = true): LieuCiteActus => ({ id, nom, type, emoji, quartier, ville, verifie });

const CAPITAINE = lieu(-1, "Restaurant du Capitaine Bouiboui", "resto", "🐟", "Écusson", "Montpellier");
const PATISSERIE_BRIGADE = lieu(-2, "Pâtisserie de la Brigade", "patisserie", "🧁", "Comédie", "Montpellier");
const FOURNEE_MIAMIS = lieu(-3, "La Fournée des Miamis", "patisserie", "🥖", "Comédie", "Montpellier");
const CANTINE_MIAMIS = lieu(-4, "La Cantine des Miamis", "resto", "🍲", "Comédie", "Montpellier", false);
const COMPTOIR_MIAMIS = lieu(-5, "Le Comptoir des Miamis", "bar", "🍷", "Écusson", "Montpellier");
const BISCUITS_BRIGADE = lieu(-6, "Les Biscuits de la Brigade", "patisserie", "🍪", "Le Canal", "Sète");
const PEDALOS_BRIGADE = lieu(-7, "Les Pédalos de la Brigade", "sortie", "🚣", "Le Canal", "Sète", false);
const CREPERIE_CAPITAINE = lieu(-8, "La Crêperie du Capitaine Bouiboui", "resto", "🥞", "Quartier haut", "Sète");
const GLACIER_MIAMIS = lieu(-9, "Le Glacier des Miamis", "patisserie", "🍦", "Corniche", "Sète");
const TARTINES_MIAMIS = lieu(-10, "Les Tartines des Miamis", "resto", "🥪", "Croix-Rousse", "Lyon");
const SALON_CHANTILLY = lieu(-11, "Le Salon Chantilly des Miamis", "patisserie", "🍰", "Croix-Rousse", "Lyon");
const RAVIOLIS_BRIGADE = lieu(-12, "Les Raviolis de la Brigade", "resto", "🥟", "Croix-Rousse", "Lyon", false);
const BOWLING_BRIGADE = lieu(-13, "Le Bowling de la Brigade", "sortie", "🎳", "Gerland", "Lyon");

const SANS_SUITE: Pick<ArticleActusExemple, "couverture" | "photos" | "collaboration" | "alcool" | "finLe" | "aLaUne" | "reponsesLieux"> = {
  couverture: null,
  photos: [],
  collaboration: false,
  alcool: false,
  finLe: null,
  aLaUne: false,
  reponsesLieux: [],
};

export const ARTICLES_ACTUS_EXEMPLE: readonly ArticleActusExemple[] = [
  {
    ...SANS_SUITE,
    id: 1,
    statut: "publie",
    rubrique: "portrait",
    titre: "Le Capitaine nous a ouvert sa cuisine",
    accroche: "Poisson du matin, soupe du soir : visite d'un bistrot de la mer qui ne triche pas.",
    paragraphes: [
      "Il est 9 h, la criée vient de passer par l'Écusson. Derrière le comptoir, le Capitaine trie la pêche arrivée à l'aube et me tend une première bouchée : « Goûte, c'est elle qui décide du menu du midi. »",
      "Ici, pas de carte longue comme le bras : six plats, ce que la mer a donné, et une soupe de poissons qui fait revenir les habitués chaque jeudi. Le pain vient de la boulangerie d'à côté, le beurre est salé comme il faut.",
      "Mon conseil : viens tôt le jeudi, et garde de la place pour la crème brûlée maison. Et si la salle est calme un soir, le Capitaine lance un SOS : c'est le moment.",
    ],
    citation: "« On ne fait que ce qu'on sait faire. Mais on le fait tous les jours. »",
    lieux: [CAPITAINE],
    auteur: ZOE,
    publieLe: "2026-10-25T09:30:00+02:00",
    aLaUne: true,
    jaime: 128,
    commentaires: 14,
    reponsesLieux: [
      {
        lieuId: CAPITAINE.id,
        nomLieu: CAPITAINE.nom,
        texte: "Merci pour ce portrait ! La crème brûlée te dit merci aussi. On t'attend jeudi, la soupe sera prête.",
        repondueLe: "2026-10-25T18:10:00+02:00",
      },
    ],
  },
  {
    ...SANS_SUITE,
    id: 2,
    statut: "publie",
    rubrique: "top-quartier",
    titre: "3 douceurs à moins de 300 m de la Comédie",
    accroche: "Trois adresses, une seule règle : ne jamais repartir sans avoir goûté.",
    paragraphes: [
      "Numéro 1 : la Pâtisserie de la Brigade, à deux pas de la place. Ses tartelettes citron-thym ont un équilibre parfait, ni trop sucrées ni trop sages.",
      "Numéro 2 : La Fournée des Miamis. Les chouquettes sortent du four toutes les heures, et la vitrine sent le beurre dès 7 h du matin.",
      "Numéro 3 : le riz au lait de La Cantine des Miamis. Oui, c'est une cantine, mais ce dessert mérite largement sa place dans ce top.",
    ],
    citation: null,
    lieux: [PATISSERIE_BRIGADE, FOURNEE_MIAMIS, CANTINE_MIAMIS],
    auteur: MALO,
    publieLe: "2026-10-24T17:00:00+02:00",
    jaime: 86,
    commentaires: 9,
  },
  {
    ...SANS_SUITE,
    id: 3,
    statut: "publie",
    rubrique: "bon-plan",
    titre: "La formule du midi de La Cantine des Miamis",
    accroche: "Tout le mois de novembre, le plat du jour et son dessert à petit prix, du lundi au vendredi.",
    paragraphes: [
      "À midi, La Cantine des Miamis se remplit vite : des étudiants, des voisins, des collègues qui ont décidé de bien manger sans y passer l'après-midi.",
      "Jusqu'à fin novembre, la formule plat et dessert passe à prix doux. Le plat change chaque jour et s'annonce sur l'ardoise dès 11 h.",
      "La cantine m'a invitée à goûter la formule, d'où la mention en haut de l'article. Mon avis reste le mien : le gratin du mardi vaut le détour.",
    ],
    citation: null,
    lieux: [CANTINE_MIAMIS],
    auteur: ZOE,
    collaboration: true,
    finLe: "2026-11-30",
    publieLe: "2026-10-23T12:00:00+02:00",
    jaime: 41,
    commentaires: 5,
  },
  {
    ...SANS_SUITE,
    id: 4,
    statut: "publie",
    rubrique: "recit-sortie",
    titre: "Un dimanche à Sète : pédalo, crêpe et glace au retour",
    accroche: "Une journée au bord de l'eau, trois adresses et des mollets qui s'en souviennent encore.",
    paragraphes: [
      "On a commencé par les Pédalos de la Brigade, sur le canal. Une heure à pédaler entre les barques colorées, et la ville vue depuis l'eau : un autre monde.",
      "Midi, direction le Quartier haut et La Crêperie du Capitaine Bouiboui. Galette complète pour moi, sarrasin aux champignons pour mon frère, et une crêpe au caramel au beurre salé à partager.",
      "Pour finir, une glace à la Corniche, au Glacier des Miamis. Le parfum figue-amande est une petite merveille, à déguster face à la mer.",
    ],
    citation: "« Le canal, ça se mérite : à la force des mollets. »",
    lieux: [PEDALOS_BRIGADE, CREPERIE_CAPITAINE, GLACIER_MIAMIS],
    auteur: INES,
    publieLe: "2026-10-22T19:45:00+02:00",
    jaime: 57,
    commentaires: 6,
  },
  {
    ...SANS_SUITE,
    id: 5,
    statut: "publie",
    rubrique: "portrait",
    titre: "Les Biscuits de la Brigade, la fournée qui sent bon le port",
    accroche: "Sablés, navettes et biscuits du jour : une petite boutique où l'on vient pour une chose et repart avec trois.",
    paragraphes: [
      "La boutique tient dans un mouchoir de poche, au bord du canal. Les plaques sortent du four à la chaîne, et l'odeur de vanille arrive jusqu'au quai.",
      "La spécialité : la navette à la fleur d'oranger, croquante dehors et tendre dedans. Les sablés au sel de Camargue partent avant midi le samedi.",
      "Petite attention qui fait plaisir : les biscuits cassés sont vendus au poids, à prix tout doux. Idéal pour le goûter des petits et des grands.",
    ],
    citation: null,
    lieux: [BISCUITS_BRIGADE],
    auteur: INES,
    publieLe: "2026-10-20T10:15:00+02:00",
    jaime: 73,
    commentaires: 8,
    reponsesLieux: [
      {
        lieuId: BISCUITS_BRIGADE.id,
        nomLieu: BISCUITS_BRIGADE.nom,
        texte: "Merci pour ce joli portrait ! Les navettes du samedi t'attendent, promis on en garde une.",
        repondueLe: "2026-10-21T08:30:00+02:00",
      },
    ],
  },
  {
    ...SANS_SUITE,
    id: 6,
    statut: "publie",
    rubrique: "top-quartier",
    titre: "Le top 3 gourmand de la Croix-Rousse",
    accroche: "Des tartines, des raviolis et un salon de thé : la colline a de quoi te régaler.",
    paragraphes: [
      "Numéro 1 : Les Tartines des Miamis. Du bon pain grillé, des légumes de saison, et une tartine chèvre-miel qui a déjà ses fans.",
      "Numéro 2 : Les Raviolis de la Brigade. Pliés à la main devant toi, à la vapeur ou poêlés, avec une sauce maison qui pique juste ce qu'il faut.",
      "Numéro 3 : Le Salon Chantilly des Miamis, pour le goûter. Le chou à la crème est aussi beau que bon, et les fauteuils donnent envie de rester.",
    ],
    citation: null,
    lieux: [TARTINES_MIAMIS, RAVIOLIS_BRIGADE, SALON_CHANTILLY],
    auteur: SAMI,
    publieLe: "2026-10-21T16:20:00+02:00",
    jaime: 64,
    commentaires: 7,
    reponsesLieux: [
      {
        lieuId: SALON_CHANTILLY.id,
        nomLieu: SALON_CHANTILLY.nom,
        texte: "Troisièmes, mais fiers de l'être ! Le chou à la crème t'attend au goûter, et les fauteuils aussi.",
        repondueLe: "2026-10-22T10:00:00+02:00",
      },
      {
        lieuId: TARTINES_MIAMIS.id,
        nomLieu: TARTINES_MIAMIS.nom,
        texte: "Merci pour la première place ! La tartine chèvre-miel change de garniture à la saison des figues.",
        repondueLe: "2026-10-23T09:15:00+02:00",
      },
    ],
  },
  {
    ...SANS_SUITE,
    id: 7,
    statut: "publie",
    rubrique: "recit-sortie",
    titre: "Bowling puis raviolis : le récit d'un mardi réussi",
    accroche: "Deux parties de bowling, une revanche ratée et un dîner qui a tout réparé.",
    paragraphes: [
      "Mardi soir, on s'est retrouvés à six au Bowling de la Brigade, à Gerland. Les pistes étaient calmes, les chaussures à notre taille, et l'ambiance au top.",
      "Après deux parties (et une revanche que je préfère oublier), direction la Croix-Rousse et Les Raviolis de la Brigade pour un dîner à partager.",
      "Bilan : des rires, des raviolis à volonté et une nouvelle tradition du mardi. Le bowling lance parfois des SOS en semaine : garde l'œil ouvert.",
    ],
    citation: "« On a perdu au bowling, mais on a gagné au dîner. »",
    lieux: [BOWLING_BRIGADE, RAVIOLIS_BRIGADE],
    auteur: SAMI,
    publieLe: "2026-10-18T21:00:00+02:00",
    jaime: 39,
    commentaires: 3,
  },
  {
    ...SANS_SUITE,
    id: 8,
    statut: "publie",
    rubrique: "bon-plan",
    titre: "Le goûter tout doux du Salon Chantilly des Miamis",
    accroche: "Jusqu'au 20 décembre, une part de gâteau et un chocolat chaud à prix réduit, en semaine après 16 h.",
    paragraphes: [
      "Le Salon Chantilly des Miamis a eu une jolie idée pour l'hiver : un goûter à prix doux, en semaine, quand la salle est plus calme.",
      "Au menu : la part de gâteau du jour et un chocolat chaud maison. Le gâteau change tous les jours, et la tarte aux pommes du jeudi vaut à elle seule le déplacement.",
    ],
    citation: null,
    lieux: [SALON_CHANTILLY],
    auteur: MALO,
    finLe: "2026-12-20",
    publieLe: "2026-10-17T15:00:00+02:00",
    jaime: 22,
    commentaires: 2,
  },
  {
    ...SANS_SUITE,
    id: 9,
    statut: "publie",
    rubrique: "portrait",
    titre: "Le Comptoir des Miamis, le nouveau bar de l'Écusson",
    accroche: "Un comptoir en bois, des tabourets hauts et une carte pensée pour les soirées entre amis.",
    paragraphes: ["Un bar de quartier qui ouvre ses portes en fin d'après-midi, avec une petite carte à grignoter."],
    citation: null,
    lieux: [COMPTOIR_MIAMIS],
    auteur: ZOE,
    alcool: true,
    publieLe: "2026-10-26T18:00:00+02:00",
    jaime: 12,
    commentaires: 1,
  },
  {
    ...SANS_SUITE,
    id: 10,
    statut: "en-relecture",
    rubrique: "portrait",
    titre: "La Fournée des Miamis, du four au comptoir",
    accroche: "Article encore entre les mains de la Brigade.",
    paragraphes: ["Ce texte attend la relecture de la Brigade : il ne doit jamais apparaître sur le site."],
    citation: null,
    lieux: [FOURNEE_MIAMIS],
    auteur: MALO,
    publieLe: "2026-10-26T09:00:00+02:00",
    jaime: 0,
    commentaires: 0,
  },
  {
    ...SANS_SUITE,
    id: 11,
    statut: "refuse",
    rubrique: "bon-plan",
    titre: "Un article refusé par la Brigade",
    accroche: "Refusé : il ne doit jamais apparaître sur le site.",
    paragraphes: ["Ce texte a été refusé par la Brigade."],
    citation: null,
    lieux: [GLACIER_MIAMIS],
    auteur: INES,
    publieLe: "2026-10-19T09:00:00+02:00",
    jaime: 0,
    commentaires: 0,
  },
];
