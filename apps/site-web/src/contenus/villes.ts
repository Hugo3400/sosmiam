// Suggestions du champ « Ta ville ou ta région » du formulaire d'inscription : on peut aussi taper autre chose.
// « ou » est la façon de le dire dans le message de confirmation : « on te prévient dès que SOS Miam arrive … ».

export type LieuPropose = { nom: string; ou: string };

const ville = (nom: string): LieuPropose => ({ nom, ou: `à ${nom}` });

export const lieuxProposes: LieuPropose[] = [
  // Villes où SOS Miam se lance en premier (voir docs/decisions.md)
  ...["Montpellier", "Sète", "Béziers", "Pézenas", "Agde", "Lunel", "Lodève", "Palavas-les-Flots"].map(ville),
  { nom: "Hérault", ou: "dans l'Hérault" },
  // Régions françaises
  { nom: "Auvergne-Rhône-Alpes", ou: "en Auvergne-Rhône-Alpes" },
  { nom: "Bourgogne-Franche-Comté", ou: "en Bourgogne-Franche-Comté" },
  { nom: "Bretagne", ou: "en Bretagne" },
  { nom: "Centre-Val de Loire", ou: "en Centre-Val de Loire" },
  { nom: "Corse", ou: "en Corse" },
  { nom: "Grand Est", ou: "dans le Grand Est" },
  { nom: "Hauts-de-France", ou: "dans les Hauts-de-France" },
  { nom: "Île-de-France", ou: "en Île-de-France" },
  { nom: "Normandie", ou: "en Normandie" },
  { nom: "Nouvelle-Aquitaine", ou: "en Nouvelle-Aquitaine" },
  { nom: "Occitanie", ou: "en Occitanie" },
  { nom: "Pays de la Loire", ou: "dans les Pays de la Loire" },
  { nom: "Provence-Alpes-Côte d'Azur", ou: "en Provence-Alpes-Côte d'Azur" },
  { nom: "Guadeloupe", ou: "en Guadeloupe" },
  { nom: "Martinique", ou: "en Martinique" },
  { nom: "Guyane", ou: "en Guyane" },
  { nom: "La Réunion", ou: "à La Réunion" },
  { nom: "Mayotte", ou: "à Mayotte" },
];
