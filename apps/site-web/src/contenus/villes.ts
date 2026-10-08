// Suggestions du champ « Ta ville ou ta région » du formulaire d'inscription : on peut aussi taper autre chose.
// Pour chaque région : son nom officiel, puis ses 6 plus grandes villes, de la plus peuplée à la moins peuplée (populations
// municipales INSEE en vigueur au 1er janvier 2026, via geo.api.gouv.fr), chef-lieu de région toujours compris. L'Occitanie, où l'on se lance, commence par nos villes de l'Hérault.
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
  lancement?: boolean;
  /** Villes de lancement, proposées en premier */
  villesLancement?: Ville[];
  /** Département de lancement, proposé juste après */
  departement?: [nom: string, ou: string];
  villes: Ville[];
};

const regions: Region[] = [
  {
    nom: "Occitanie", ou: "en Occitanie", lancement: true,
    villesLancement: ["Montpellier", "Sète", "Béziers", "Pézenas", "Agde", "Lunel", "Lodève", "Palavas-les-Flots"],
    departement: ["Hérault", "dans l'Hérault"],
    villes: ["Toulouse", "Nîmes", "Perpignan", "Montauban"],
  },
  { nom: "Auvergne-Rhône-Alpes", ou: "en Auvergne-Rhône-Alpes", villes: ["Lyon", "Saint-Étienne", "Villeurbanne", "Grenoble", "Clermont-Ferrand", "Annecy"] },
  { nom: "Bourgogne-Franche-Comté", ou: "en Bourgogne-Franche-Comté", villes: ["Dijon", "Besançon", "Belfort", "Chalon-sur-Saône", "Mâcon", "Auxerre"] },
  { nom: "Bretagne", ou: "en Bretagne", villes: ["Rennes", "Brest", "Quimper", "Lorient", "Vannes", "Saint-Malo"] },
  { nom: "Centre-Val de Loire", ou: "en Centre-Val de Loire", villes: ["Tours", "Orléans", "Bourges", "Blois", "Châteauroux", "Joué-lès-Tours"] },
  { nom: "Corse", ou: "en Corse", villes: ["Ajaccio", "Bastia", "Porto-Vecchio", "Borgo"] },
  { nom: "Grand Est", ou: "dans le Grand Est", villes: ["Strasbourg", "Reims", "Metz", "Mulhouse", "Nancy", "Colmar"] },
  { nom: "Hauts-de-France", ou: "dans les Hauts-de-France", villes: ["Lille", "Amiens", "Tourcoing", "Roubaix", "Dunkerque", "Calais"] },
  { nom: "Île-de-France", ou: "en Île-de-France", villes: ["Paris", "Saint-Denis", "Boulogne-Billancourt", "Montreuil", "Argenteuil", "Nanterre"] },
  { nom: "Normandie", ou: "en Normandie", villes: [["Le Havre", "au Havre"], "Rouen", "Caen", "Cherbourg-en-Cotentin", "Évreux", "Saint-Étienne-du-Rouvray"] },
  { nom: "Nouvelle-Aquitaine", ou: "en Nouvelle-Aquitaine", villes: ["Bordeaux", "Limoges", "Poitiers", "Pau", "La Rochelle", "Mérignac"] },
  { nom: "Pays de la Loire", ou: "dans les Pays de la Loire", villes: ["Nantes", "Angers", ["Le Mans", "au Mans"], "Saint-Nazaire", "La Roche-sur-Yon", "Cholet"] },
  { nom: "Provence-Alpes-Côte d'Azur", ou: "en Provence-Alpes-Côte d'Azur", villes: ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Antibes"] },
  { nom: "Guadeloupe", ou: "en Guadeloupe", villes: [["Les Abymes", "aux Abymes"], "Baie-Mahault", ["Le Gosier", "au Gosier"], "Petit-Bourg", "Sainte-Anne", ["Le Moule", "au Moule"], "Basse-Terre"] },
  { nom: "Guyane", ou: "en Guyane", villes: ["Cayenne", "Saint-Laurent-du-Maroni", "Matoury", "Remire-Montjoly", "Kourou"] },
  { nom: "La Réunion", ou: "à La Réunion", villes: ["Saint-Denis", "Saint-Paul", "Saint-Pierre", ["Le Tampon", "au Tampon"], "Saint-André", "Saint-Louis"] },
  { nom: "Martinique", ou: "en Martinique", villes: ["Fort-de-France", ["Le Lamentin", "au Lamentin"], ["Le Robert", "au Robert"], "Schœlcher", "Ducos"] },
  { nom: "Mayotte", ou: "à Mayotte", villes: ["Mamoudzou", "Koungou", "Dzaoudzi", "Dembeni"] },
];

const nomDe = (ville: Ville) => (typeof ville === "string" ? ville : ville[0]);
const ouDe = (ville: Ville) => (typeof ville === "string" ? `à ${ville}` : ville[1]);
const identifiant = (type: TypeLieu, texte: string) => `${type}-${normaliserRecherche(texte).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

// Noms portés par des villes de plusieurs régions (Saint-Denis) : on les précise avec la région
const tousLesNoms = regions.flatMap((region) => [...(region.villesLancement ?? []), ...region.villes].map(nomDe));
const homonymes = new Set(tousLesNoms.filter((nom, position) => tousLesNoms.indexOf(nom) !== position));

function versLieu(ville: Ville, region: string): Lieu {
  const nom = nomDe(ville);
  const valeur = homonymes.has(nom) ? `${nom} (${region})` : nom;
  return { id: identifiant("ville", valeur), nom, valeur, ou: ouDe(ville), type: "ville" };
}

export const groupesLieux: GroupeLieux[] = regions.map((region) => ({
  region: region.nom,
  lancement: region.lancement ?? false,
  lieux: [
    { id: identifiant("region", region.nom), nom: region.nom, valeur: region.nom, ou: region.ou, type: "region" },
    ...(region.villesLancement ?? []).map((ville) => versLieu(ville, region.nom)),
    ...(region.departement
      ? [{ id: identifiant("departement", region.departement[0]), nom: region.departement[0], valeur: region.departement[0], ou: region.departement[1], type: "departement" as const }]
      : []),
    ...region.villes.map((ville) => versLieu(ville, region.nom)),
  ],
}));

export const lieuxProposes: Lieu[] = groupesLieux.flatMap((groupe) => groupe.lieux);
