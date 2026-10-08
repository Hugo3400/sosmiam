// Suggestions du champ « Ta ville ou ta région » du formulaire d'inscription : on peut aussi taper autre chose.
// Pour chaque région : son nom officiel, puis ses 6 plus grandes villes, de la plus peuplée à la moins peuplée (populations
// municipales INSEE en vigueur au 1er janvier 2026, via geo.api.gouv.fr ; Mayotte : population légale de 2017), puis le
// chef-lieu de région s'il n'y est pas, et deux villes très connues juste sous le seuil (Chartres, Pointe-à-Pitre).
// « alias » : autres noms d'une région (PACA, IDF…), ramenés à son nom officiel ; « parties » : anciennes régions et coins
// connus (Alsace, Provence…), reconnus et enregistrés avec leur région : « Grand Est (Alsace) ». L'Occitanie, où l'on se lance, commence par nos villes de l'Hérault.
// « ou » complète « On te prévient dès que SOS Miam arrive … ».
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

export type TypeLieu = "region" | "departement" | "ville";

export type Lieu = {
  /** Identifiant unique dans la liste de suggestions */
  id: string;
  /** Nom affiché dans la liste : « Saint-Denis » */
  nom: string;
  /** Ce qui s'écrit dans le champ et s'enregistre, précisé quand deux villes ont le même nom : « Saint-Denis (La Réunion) » */
  valeur: string;
  /** « à Lyon », « au Havre », « en Occitanie » */
  ou: string;
  type: TypeLieu;
  /** Région du lieu (pour une région : elle-même) */
  region: string;
  /** Autres noms courants, reconnus quand on les tape : « PACA », « Réunion » */
  alias: string[];
  /** Anciennes régions ou parties connues (« Alsace ») : reconnues, et gardées en précision */
  parties: string[];
};

export type GroupeLieux = {
  region: string;
  /** Région où SOS Miam se lance en premier */
  lancement: boolean;
  lieux: Lieu[];
};

/** Une ville : son nom, ou son nom et sa préposition quand ce n'est pas « à » (« au Havre »). */
type Ville = string | [nom: string, ou: string];

type Region = {
  nom: string;
  ou: string;
  alias?: string[];
  parties?: string[];
  lancement?: boolean;
  /** Villes de lancement, proposées en premier */
  villesLancement?: Ville[];
  /** Département de lancement, proposé juste après */
  departement?: [nom: string, ou: string];
  villes: Ville[];
};

const regions: Region[] = [
  {
    nom: "Occitanie", ou: "en Occitanie", parties: ["Languedoc", "Languedoc-Roussillon", "Midi-Pyrénées"], lancement: true,
    villesLancement: ["Montpellier", "Sète", "Béziers", "Pézenas", "Agde", "Lunel", "Lodève", "Palavas-les-Flots"],
    departement: ["Hérault", "dans l'Hérault"],
    villes: ["Toulouse", "Nîmes", "Perpignan", "Montauban"],
  },
  { nom: "Auvergne-Rhône-Alpes", ou: "en Auvergne-Rhône-Alpes", alias: ["AURA"], parties: ["Auvergne", "Rhône-Alpes"], villes: ["Lyon", "Saint-Étienne", "Villeurbanne", "Grenoble", "Clermont-Ferrand", "Annecy"] },
  { nom: "Bourgogne-Franche-Comté", ou: "en Bourgogne-Franche-Comté", alias: ["BFC"], parties: ["Bourgogne", "Franche-Comté"], villes: ["Dijon", "Besançon", "Belfort", "Chalon-sur-Saône", "Mâcon", "Auxerre"] },
  { nom: "Bretagne", ou: "en Bretagne", villes: ["Rennes", "Brest", "Quimper", "Lorient", "Vannes", "Saint-Malo"] },
  { nom: "Centre-Val de Loire", ou: "en Centre-Val de Loire", alias: ["Centre"], villes: ["Tours", "Orléans", "Bourges", "Blois", "Châteauroux", "Joué-lès-Tours", "Chartres"] },
  { nom: "Corse", ou: "en Corse", villes: ["Ajaccio", "Bastia", "Porto-Vecchio", "Borgo", "Corte", "Biguglia"] },
  { nom: "Grand Est", ou: "dans le Grand Est", parties: ["Alsace", "Lorraine", "Champagne", "Champagne-Ardenne"], villes: ["Strasbourg", "Reims", "Metz", "Mulhouse", "Nancy", "Colmar"] },
  { nom: "Hauts-de-France", ou: "dans les Hauts-de-France", parties: ["Nord-Pas-de-Calais", "Picardie"], villes: ["Lille", "Amiens", "Tourcoing", "Roubaix", "Dunkerque", "Calais"] },
  { nom: "Île-de-France", ou: "en Île-de-France", alias: ["IDF", "Région parisienne"], villes: ["Paris", "Saint-Denis", "Boulogne-Billancourt", "Montreuil", "Argenteuil", "Nanterre"] },
  { nom: "Normandie", ou: "en Normandie", villes: [["Le Havre", "au Havre"], "Rouen", "Caen", "Cherbourg-en-Cotentin", "Évreux", "Saint-Étienne-du-Rouvray"] },
  { nom: "Nouvelle-Aquitaine", ou: "en Nouvelle-Aquitaine", parties: ["Aquitaine", "Limousin", "Poitou-Charentes"], villes: ["Bordeaux", "Limoges", "Poitiers", "Pau", "La Rochelle", "Mérignac"] },
  { nom: "Pays de la Loire", ou: "dans les Pays de la Loire", villes: ["Nantes", "Angers", ["Le Mans", "au Mans"], "Saint-Nazaire", "La Roche-sur-Yon", "Cholet"] },
  { nom: "Provence-Alpes-Côte d'Azur", ou: "en Provence-Alpes-Côte d'Azur", alias: ["PACA"], parties: ["Provence", "Côte d'Azur"], villes: ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Antibes"] },
  { nom: "Guadeloupe", ou: "en Guadeloupe", villes: [["Les Abymes", "aux Abymes"], "Baie-Mahault", ["Le Gosier", "au Gosier"], "Petit-Bourg", "Sainte-Anne", ["Le Moule", "au Moule"], "Basse-Terre", "Pointe-à-Pitre"] },
  { nom: "Guyane", ou: "en Guyane", villes: ["Cayenne", "Saint-Laurent-du-Maroni", "Matoury", "Remire-Montjoly", "Kourou", "Macouria"] },
  { nom: "La Réunion", ou: "à La Réunion", alias: ["Réunion"], villes: ["Saint-Denis", "Saint-Paul", "Saint-Pierre", ["Le Tampon", "au Tampon"], "Saint-André", "Saint-Louis"] },
  { nom: "Martinique", ou: "en Martinique", villes: ["Fort-de-France", ["Le Lamentin", "au Lamentin"], ["Le Robert", "au Robert"], "Schœlcher", "Ducos", "Saint-Joseph"] },
  { nom: "Mayotte", ou: "à Mayotte", villes: ["Mamoudzou", "Koungou", "Dzaoudzi", "Dembeni", "Bandraboua", "Tsingoni"] },
];

const lireNom = (ville: Ville) => (typeof ville === "string" ? ville : ville[0]);
const lirePreposition = (ville: Ville) => (typeof ville === "string" ? `à ${ville}` : ville[1]);
const creerIdentifiant = (type: TypeLieu, texte: string) =>
  `${type}-${normaliserRecherche(texte).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

// Noms portés par des villes de plusieurs régions (Saint-Denis) : on les précise avec la région
const tousLesNoms = regions.flatMap((region) => [...(region.villesLancement ?? []), ...region.villes].map(lireNom));
const homonymes = new Set(tousLesNoms.filter((nom, position) => tousLesNoms.indexOf(nom) !== position));

function convertirEnLieu(ville: Ville, region: string): Lieu {
  const nom = lireNom(ville);
  const valeur = homonymes.has(nom) ? `${nom} (${region})` : nom;
  return { id: creerIdentifiant("ville", valeur), nom, valeur, ou: lirePreposition(ville), type: "ville", region, alias: [], parties: [] };
}

export const groupesLieux: GroupeLieux[] = regions.map((region) => ({
  region: region.nom,
  lancement: region.lancement ?? false,
  lieux: [
    {
      id: creerIdentifiant("region", region.nom), nom: region.nom, valeur: region.nom, ou: region.ou,
      type: "region", region: region.nom, alias: region.alias ?? [], parties: region.parties ?? [],
    },
    ...(region.villesLancement ?? []).map((ville) => convertirEnLieu(ville, region.nom)),
    ...(region.departement
      ? [{
          id: creerIdentifiant("departement", region.departement[0]), nom: region.departement[0], valeur: region.departement[0],
          ou: region.departement[1], type: "departement" as const, region: region.nom, alias: [], parties: [],
        }]
      : []),
    ...region.villes.map((ville) => convertirEnLieu(ville, region.nom)),
  ],
}));

export const lieuxProposes: Lieu[] = groupesLieux.flatMap((groupe) => groupe.lieux);
