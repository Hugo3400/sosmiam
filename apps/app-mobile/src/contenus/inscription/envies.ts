// Les envies demandées à l'inscription, une étape par catégorie (voir docs/decisions.md).
// « alcool » : masqué entre 15 et 17 ans (AGE_ALCOOL). « sensible » : peut révéler une religion ou la santé (RGPD, article 9).
import type { CategorieEnvie } from "@sos-miam/commun/types/profil";

export type ChoixEnvie = {
  id: string;
  libelle: string;
  emoji: string;
  alcool?: boolean;
  sensible?: boolean;
};

export type EtapeEnvies = {
  categorie: CategorieEnvie;
  /** Nom court de la catégorie (écran Profil) */
  nom: string;
  emoji: string;
  titre: string;
  sousTitre: string;
  /** Toute l'étape est masquée aux moins de 18 ans */
  alcool?: boolean;
  /** Mention affichée sous les choix */
  note?: string;
  choix: ChoixEnvie[];
};

export const etapesEnvies: EtapeEnvies[] = [
  {
    categorie: "lieux",
    nom: "Lieux",
    emoji: "🍽️",
    titre: "Tu sors où ?",
    sousTitre: "Choisis tout ce qui te tente, on s'occupe du reste.",
    choix: [
      { id: "restos", libelle: "Restos", emoji: "🍝" },
      { id: "patisseries", libelle: "Pâtisseries et boulangeries", emoji: "🥐" },
      { id: "cafes", libelle: "Cafés", emoji: "☕" },
      { id: "bars", libelle: "Bars", emoji: "🍹", alcool: true },
      { id: "caves", libelle: "Caves à vin", emoji: "🍷", alcool: true },
      { id: "bowlings", libelle: "Bowlings", emoji: "🎳" },
      { id: "escape-games", libelle: "Escape games", emoji: "🗝️" },
      { id: "ateliers", libelle: "Ateliers", emoji: "🎨" },
      { id: "nature", libelle: "Sorties nature", emoji: "🛶" },
      { id: "concerts", libelle: "Concerts et salles d'événements", emoji: "🎤" },
    ],
  },
  {
    categorie: "cuisines",
    nom: "Cuisines",
    emoji: "🍝",
    titre: "Qu'est-ce qui te fait saliver ?",
    sousTitre: "Tes cuisines préférées, sans te limiter.",
    choix: [
      { id: "italien", libelle: "Italien", emoji: "🍕" },
      { id: "asiatique", libelle: "Asiatique", emoji: "🥢" },
      { id: "burger", libelle: "Burgers", emoji: "🍔" },
      { id: "street-food", libelle: "Street food", emoji: "🌯" },
      { id: "fruits-de-mer", libelle: "Fruits de mer", emoji: "🦪" },
      { id: "local", libelle: "Spécialités d'ici", emoji: "🐙" },
      { id: "brunch", libelle: "Brunch", emoji: "🥞" },
      { id: "sucre", libelle: "Sucré", emoji: "🍰" },
      { id: "gastronomique", libelle: "Gastronomique", emoji: "✨" },
      { id: "monde", libelle: "Cuisines du monde", emoji: "🌍" },
    ],
  },
  {
    categorie: "boissons",
    nom: "Boissons",
    emoji: "🍹",
    titre: "Et pour boire ?",
    sousTitre: "Avec ou sans alcool, tout se défend.",
    choix: [
      { id: "cocktails", libelle: "Cocktails", emoji: "🍸", alcool: true },
      { id: "vins", libelle: "Vins (nature aussi)", emoji: "🍷", alcool: true },
      { id: "bieres", libelle: "Bières artisanales", emoji: "🍺", alcool: true },
      { id: "apero", libelle: "Apéro et spritz", emoji: "🥂", alcool: true },
      { id: "cafes-specialite", libelle: "Cafés de spécialité", emoji: "☕" },
      { id: "thes", libelle: "Thés et bubble tea", emoji: "🧋" },
      { id: "jus", libelle: "Jus et smoothies", emoji: "🥤" },
      { id: "sans-alcool", libelle: "Sans alcool et mocktails", emoji: "🍹" },
    ],
  },
  {
    categorie: "bars",
    nom: "Bars",
    emoji: "🍻",
    titre: "Ton bar idéal ?",
    sousTitre: "Pour l'apéro, la soirée ou le dernier verre.",
    alcool: true,
    choix: [
      { id: "bar-cocktails", libelle: "Bar à cocktails", emoji: "🍸" },
      { id: "bar-vin", libelle: "Bar à vin", emoji: "🍷" },
      { id: "pub", libelle: "Pub", emoji: "🍺" },
      { id: "bar-jeux", libelle: "Bar à jeux", emoji: "🎲" },
      { id: "rooftop", libelle: "Rooftop et terrasse", emoji: "🌇" },
      { id: "bar-concert", libelle: "Bar concert", emoji: "🎸" },
      { id: "bar-dansant", libelle: "Bar dansant", emoji: "🪩" },
      { id: "cafe-quartier", libelle: "Café de quartier", emoji: "🏘️" },
    ],
  },
  {
    categorie: "musique",
    nom: "Musique",
    emoji: "🎶",
    titre: "Côté musique ?",
    sousTitre: "L'ambiance qui te fait rester.",
    choix: [
      { id: "pop", libelle: "Pop", emoji: "🎵" },
      { id: "rock", libelle: "Rock", emoji: "🎸" },
      { id: "electro", libelle: "Électro", emoji: "🎧" },
      { id: "rap", libelle: "Rap et hip-hop", emoji: "🎤" },
      { id: "jazz", libelle: "Jazz et soul", emoji: "🎷" },
      { id: "latino", libelle: "Latino", emoji: "💃" },
      { id: "chanson", libelle: "Chanson française", emoji: "🇫🇷" },
      { id: "reggae", libelle: "Reggae", emoji: "🌴" },
      { id: "live", libelle: "Concerts live", emoji: "🎙️" },
      { id: "calme", libelle: "Au calme", emoji: "🤫" },
    ],
  },
  {
    categorie: "jeux",
    nom: "Jeux et activités",
    emoji: "🎲",
    titre: "On joue ?",
    sousTitre: "Les activités qui te font sortir de chez toi.",
    choix: [
      { id: "quiz", libelle: "Quiz", emoji: "❓" },
      { id: "blind-test", libelle: "Blind test", emoji: "🎶" },
      { id: "jeux-societe", libelle: "Jeux de société", emoji: "🎲" },
      { id: "karaoke", libelle: "Karaoké", emoji: "🎤" },
      { id: "flechettes", libelle: "Fléchettes", emoji: "🎯" },
      { id: "billard", libelle: "Billard", emoji: "🎱" },
      { id: "petanque", libelle: "Pétanque", emoji: "⚪" },
      { id: "bowling", libelle: "Bowling", emoji: "🎳" },
      { id: "escape-game", libelle: "Escape game", emoji: "🗝️" },
      { id: "laser-game", libelle: "Laser game", emoji: "🔫" },
    ],
  },
  {
    categorie: "moments",
    nom: "Moments",
    emoji: "💛",
    titre: "Tu sors plutôt…",
    sousTitre: "Pour te proposer le bon lieu au bon moment.",
    choix: [
      { id: "amoureux", libelle: "En amoureux", emoji: "💕" },
      { id: "potes", libelle: "Entre potes", emoji: "🧑‍🤝‍🧑" },
      { id: "famille", libelle: "En famille", emoji: "👨‍👩‍👧" },
      { id: "solo", libelle: "En solo", emoji: "🎧" },
      { id: "petit-budget", libelle: "Petit budget", emoji: "🪙" },
      { id: "festif", libelle: "Festif", emoji: "🎉" },
      { id: "au-calme", libelle: "Au calme", emoji: "🌿" },
    ],
  },
  {
    categorie: "regimes",
    nom: "Régime particulier",
    emoji: "🥗",
    titre: "Un régime particulier ?",
    sousTitre: "Facultatif : pour te montrer les lieux qui te conviennent.",
    note: "Ces choix restent sur ton téléphone et servent seulement à te proposer des lieux adaptés. Tu peux les changer ou les effacer quand tu veux.",
    choix: [
      { id: "vegetarien", libelle: "Végétarien", emoji: "🥕" },
      { id: "vegan", libelle: "Vegan", emoji: "🌱" },
      { id: "pescetarien", libelle: "Pescétarien", emoji: "🐟" },
      { id: "sans-gluten", libelle: "Sans gluten", emoji: "🌾", sensible: true },
      { id: "sans-lactose", libelle: "Sans lactose", emoji: "🥛", sensible: true },
      { id: "sans-porc", libelle: "Sans porc", emoji: "🐖", sensible: true },
      { id: "halal", libelle: "Halal", emoji: "🌙", sensible: true },
      { id: "casher", libelle: "Casher", emoji: "✡️", sensible: true },
      { id: "allergie-fruits-a-coque", libelle: "Allergie aux fruits à coque", emoji: "🥜", sensible: true },
      { id: "allergie-fruits-de-mer", libelle: "Allergie aux fruits de mer", emoji: "🦐", sensible: true },
    ],
  },
];
