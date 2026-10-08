// Villes de France proposées à l'inscription et utilisées pour les distances : villes de lancement, puis les plus grandes
// villes de chaque région (même liste que le site, apps/site-web/src/contenus/villes.ts), plus les villes des lieux d'exemple.
// Coordonnées : centre de la commune d'après geo.api.gouv.fr (8 octobre 2026). On peut toujours taper une autre ville.

export type VilleFrance = {
  nom: string;
  /** Ce qui s'écrit et s'enregistre : le nom, précisé de la région quand deux villes s'appellent pareil */
  valeur: string;
  region: string;
  latitude: number;
  longitude: number;
  /** Ville où SOS Miam se lance en premier : proposée avant les autres */
  lancement?: boolean;
};

export const villesFrance: VilleFrance[] = [
  // Occitanie
  { nom: "Montpellier", valeur: "Montpellier", region: "Occitanie", latitude: 43.61, longitude: 3.8742, lancement: true },
  { nom: "Sète", valeur: "Sète", region: "Occitanie", latitude: 43.3844, longitude: 3.6441, lancement: true },
  { nom: "Béziers", valeur: "Béziers", region: "Occitanie", latitude: 43.3481, longitude: 3.2342, lancement: true },
  { nom: "Pézenas", valeur: "Pézenas", region: "Occitanie", latitude: 43.4616, longitude: 3.418, lancement: true },
  { nom: "Agde", valeur: "Agde", region: "Occitanie", latitude: 43.3084, longitude: 3.4838, lancement: true },
  { nom: "Lunel", valeur: "Lunel", region: "Occitanie", latitude: 43.678, longitude: 4.1329, lancement: true },
  { nom: "Lodève", valeur: "Lodève", region: "Occitanie", latitude: 43.7296, longitude: 3.2949, lancement: true },
  { nom: "Palavas-les-Flots", valeur: "Palavas-les-Flots", region: "Occitanie", latitude: 43.5323, longitude: 3.9346, lancement: true },
  { nom: "Toulouse", valeur: "Toulouse", region: "Occitanie", latitude: 43.6007, longitude: 1.4328 },
  { nom: "Nîmes", valeur: "Nîmes", region: "Occitanie", latitude: 43.8322, longitude: 4.3429 },
  { nom: "Perpignan", valeur: "Perpignan", region: "Occitanie", latitude: 42.699, longitude: 2.9045 },
  { nom: "Montauban", valeur: "Montauban", region: "Occitanie", latitude: 44.0217, longitude: 1.3646 },
  // Auvergne-Rhône-Alpes
  { nom: "Lyon", valeur: "Lyon", region: "Auvergne-Rhône-Alpes", latitude: 45.758, longitude: 4.8351 },
  { nom: "Saint-Étienne", valeur: "Saint-Étienne", region: "Auvergne-Rhône-Alpes", latitude: 45.4241, longitude: 4.3665 },
  { nom: "Villeurbanne", valeur: "Villeurbanne", region: "Auvergne-Rhône-Alpes", latitude: 45.7719, longitude: 4.8898 },
  { nom: "Grenoble", valeur: "Grenoble", region: "Auvergne-Rhône-Alpes", latitude: 45.1842, longitude: 5.7155 },
  { nom: "Clermont-Ferrand", valeur: "Clermont-Ferrand", region: "Auvergne-Rhône-Alpes", latitude: 45.787, longitude: 3.1127 },
  { nom: "Annecy", valeur: "Annecy", region: "Auvergne-Rhône-Alpes", latitude: 45.9024, longitude: 6.1264 },
  // Bourgogne-Franche-Comté
  { nom: "Dijon", valeur: "Dijon", region: "Bourgogne-Franche-Comté", latitude: 47.3319, longitude: 5.0322 },
  { nom: "Besançon", valeur: "Besançon", region: "Bourgogne-Franche-Comté", latitude: 47.2602, longitude: 6.0123 },
  { nom: "Belfort", valeur: "Belfort", region: "Bourgogne-Franche-Comté", latitude: 47.6458, longitude: 6.841 },
  { nom: "Chalon-sur-Saône", valeur: "Chalon-sur-Saône", region: "Bourgogne-Franche-Comté", latitude: 46.7896, longitude: 4.8509 },
  { nom: "Mâcon", valeur: "Mâcon", region: "Bourgogne-Franche-Comté", latitude: 46.3265, longitude: 4.8083 },
  { nom: "Auxerre", valeur: "Auxerre", region: "Bourgogne-Franche-Comté", latitude: 47.7939, longitude: 3.5821 },
  // Bretagne
  { nom: "Rennes", valeur: "Rennes", region: "Bretagne", latitude: 48.1159, longitude: -1.6884 },
  { nom: "Brest", valeur: "Brest", region: "Bretagne", latitude: 48.4085, longitude: -4.4996 },
  { nom: "Quimper", valeur: "Quimper", region: "Bretagne", latitude: 47.9982, longitude: -4.0972 },
  { nom: "Lorient", valeur: "Lorient", region: "Bretagne", latitude: 47.7494, longitude: -3.3799 },
  { nom: "Vannes", valeur: "Vannes", region: "Bretagne", latitude: 47.6577, longitude: -2.7485 },
  { nom: "Saint-Malo", valeur: "Saint-Malo", region: "Bretagne", latitude: 48.6465, longitude: -2.0066 },
  // Centre-Val de Loire
  { nom: "Tours", valeur: "Tours", region: "Centre-Val de Loire", latitude: 47.3943, longitude: 0.6949 },
  { nom: "Orléans", valeur: "Orléans", region: "Centre-Val de Loire", latitude: 47.8734, longitude: 1.9122 },
  { nom: "Bourges", valeur: "Bourges", region: "Centre-Val de Loire", latitude: 47.078, longitude: 2.3983 },
  { nom: "Blois", valeur: "Blois", region: "Centre-Val de Loire", latitude: 47.5813, longitude: 1.3049 },
  { nom: "Châteauroux", valeur: "Châteauroux", region: "Centre-Val de Loire", latitude: 46.8023, longitude: 1.6903 },
  { nom: "Joué-lès-Tours", valeur: "Joué-lès-Tours", region: "Centre-Val de Loire", latitude: 47.3374, longitude: 0.6544 },
  { nom: "Chartres", valeur: "Chartres", region: "Centre-Val de Loire", latitude: 48.4481, longitude: 1.5046 },
  // Corse
  { nom: "Ajaccio", valeur: "Ajaccio", region: "Corse", latitude: 41.9228, longitude: 8.7058 },
  { nom: "Bastia", valeur: "Bastia", region: "Corse", latitude: 42.6861, longitude: 9.424 },
  { nom: "Porto-Vecchio", valeur: "Porto-Vecchio", region: "Corse", latitude: 41.5849, longitude: 9.2732 },
  { nom: "Borgo", valeur: "Borgo", region: "Corse", latitude: 42.5809, longitude: 9.4546 },
  { nom: "Corte", valeur: "Corte", region: "Corse", latitude: 42.2737, longitude: 9.0691 },
  { nom: "Biguglia", valeur: "Biguglia", region: "Corse", latitude: 42.6133, longitude: 9.4401 },
  // Grand Est
  { nom: "Strasbourg", valeur: "Strasbourg", region: "Grand Est", latitude: 48.5691, longitude: 7.7621 },
  { nom: "Reims", valeur: "Reims", region: "Grand Est", latitude: 49.2535, longitude: 4.0551 },
  { nom: "Metz", valeur: "Metz", region: "Grand Est", latitude: 49.1048, longitude: 6.1962 },
  { nom: "Mulhouse", valeur: "Mulhouse", region: "Grand Est", latitude: 47.7526, longitude: 7.3255 },
  { nom: "Nancy", valeur: "Nancy", region: "Grand Est", latitude: 48.6881, longitude: 6.1734 },
  { nom: "Colmar", valeur: "Colmar", region: "Grand Est", latitude: 48.1115, longitude: 7.3924 },
  // Hauts-de-France
  { nom: "Lille", valeur: "Lille", region: "Hauts-de-France", latitude: 50.6311, longitude: 3.0468 },
  { nom: "Amiens", valeur: "Amiens", region: "Hauts-de-France", latitude: 49.8987, longitude: 2.2847 },
  { nom: "Tourcoing", valeur: "Tourcoing", region: "Hauts-de-France", latitude: 50.721, longitude: 3.1577 },
  { nom: "Roubaix", valeur: "Roubaix", region: "Hauts-de-France", latitude: 50.6887, longitude: 3.1843 },
  { nom: "Dunkerque", valeur: "Dunkerque", region: "Hauts-de-France", latitude: 51.0183, longitude: 2.3431 },
  { nom: "Calais", valeur: "Calais", region: "Hauts-de-France", latitude: 50.9523, longitude: 1.869 },
  // Île-de-France
  { nom: "Paris", valeur: "Paris", region: "Île-de-France", latitude: 48.8589, longitude: 2.347 },
  { nom: "Saint-Denis", valeur: "Saint-Denis (Île-de-France)", region: "Île-de-France", latitude: 48.9378, longitude: 2.3657 },
  { nom: "Boulogne-Billancourt", valeur: "Boulogne-Billancourt", region: "Île-de-France", latitude: 48.8375, longitude: 2.2429 },
  { nom: "Montreuil", valeur: "Montreuil", region: "Île-de-France", latitude: 48.8637, longitude: 2.4491 },
  { nom: "Argenteuil", valeur: "Argenteuil", region: "Île-de-France", latitude: 48.9501, longitude: 2.2478 },
  { nom: "Nanterre", valeur: "Nanterre", region: "Île-de-France", latitude: 48.8974, longitude: 2.2018 },
  // Normandie
  { nom: "Le Havre", valeur: "Le Havre", region: "Normandie", latitude: 49.4958, longitude: 0.1312 },
  // Nouvelle-Aquitaine
  { nom: "Bordeaux", valeur: "Bordeaux", region: "Nouvelle-Aquitaine", latitude: 44.8624, longitude: -0.5848 },
  { nom: "Limoges", valeur: "Limoges", region: "Nouvelle-Aquitaine", latitude: 45.8567, longitude: 1.226 },
  { nom: "Poitiers", valeur: "Poitiers", region: "Nouvelle-Aquitaine", latitude: 46.5846, longitude: 0.3715 },
  { nom: "Pau", valeur: "Pau", region: "Nouvelle-Aquitaine", latitude: 43.3219, longitude: -0.3435 },
  { nom: "La Rochelle", valeur: "La Rochelle", region: "Nouvelle-Aquitaine", latitude: 46.162, longitude: -1.1765 },
  { nom: "Mérignac", valeur: "Mérignac", region: "Nouvelle-Aquitaine", latitude: 44.8313, longitude: -0.682 },
  // Pays de la Loire
  { nom: "Nantes", valeur: "Nantes", region: "Pays de la Loire", latitude: 47.2382, longitude: -1.5603 },
  { nom: "Angers", valeur: "Angers", region: "Pays de la Loire", latitude: 47.4819, longitude: -0.5629 },
  { nom: "Le Mans", valeur: "Le Mans", region: "Pays de la Loire", latitude: 47.9819, longitude: 0.1957 },
  // Provence-Alpes-Côte d'Azur
  { nom: "Marseille", valeur: "Marseille", region: "Provence-Alpes-Côte d'Azur", latitude: 43.2803, longitude: 5.3806 },
  { nom: "Nice", valeur: "Nice", region: "Provence-Alpes-Côte d'Azur", latitude: 43.7032, longitude: 7.2528 },
  { nom: "Toulon", valeur: "Toulon", region: "Provence-Alpes-Côte d'Azur", latitude: 43.1364, longitude: 5.9334 },
  { nom: "Aix-en-Provence", valeur: "Aix-en-Provence", region: "Provence-Alpes-Côte d'Azur", latitude: 43.536, longitude: 5.3879 },
  { nom: "Avignon", valeur: "Avignon", region: "Provence-Alpes-Côte d'Azur", latitude: 43.9416, longitude: 4.8333 },
  { nom: "Antibes", valeur: "Antibes", region: "Provence-Alpes-Côte d'Azur", latitude: 43.5823, longitude: 7.1048 },
  // Guadeloupe
  { nom: "Les Abymes", valeur: "Les Abymes", region: "Guadeloupe", latitude: 16.2678, longitude: -61.4967 },
  // Guyane
  { nom: "Cayenne", valeur: "Cayenne", region: "Guyane", latitude: 4.9464, longitude: -52.3319 },
  { nom: "Saint-Laurent-du-Maroni", valeur: "Saint-Laurent-du-Maroni", region: "Guyane", latitude: 4.9478, longitude: -54.0105 },
  { nom: "Matoury", valeur: "Matoury", region: "Guyane", latitude: 4.8281, longitude: -52.3498 },
  { nom: "Remire-Montjoly", valeur: "Remire-Montjoly", region: "Guyane", latitude: 4.8897, longitude: -52.2809 },
  { nom: "Kourou", valeur: "Kourou", region: "Guyane", latitude: 4.9085, longitude: -52.7767 },
  { nom: "Macouria", valeur: "Macouria", region: "Guyane", latitude: 4.9925, longitude: -52.4835 },
  // La Réunion
  { nom: "Saint-Denis", valeur: "Saint-Denis (La Réunion)", region: "La Réunion", latitude: -20.9434, longitude: 55.4444 },
  { nom: "Saint-Paul", valeur: "Saint-Paul", region: "La Réunion", latitude: -21.0366, longitude: 55.3402 },
  { nom: "Saint-Pierre", valeur: "Saint-Pierre", region: "La Réunion", latitude: -21.309, longitude: 55.5044 },
  { nom: "Le Tampon", valeur: "Le Tampon", region: "La Réunion", latitude: -21.225, longitude: 55.5701 },
  // Martinique
  { nom: "Fort-de-France", valeur: "Fort-de-France", region: "Martinique", latitude: 14.6492, longitude: -61.0686 },
  { nom: "Le Lamentin", valeur: "Le Lamentin", region: "Martinique", latitude: 14.6231, longitude: -60.9923 },
  // Mayotte
  { nom: "Mamoudzou", valeur: "Mamoudzou", region: "Mayotte", latitude: -12.7875, longitude: 45.1964 },
  { nom: "Koungou", valeur: "Koungou", region: "Mayotte", latitude: -12.7417, longitude: 45.1912 },
  { nom: "Dzaoudzi", valeur: "Dzaoudzi", region: "Mayotte", latitude: -12.7761, longitude: 45.2769 },
  { nom: "Dembeni", valeur: "Dembeni", region: "Mayotte", latitude: -12.853, longitude: 45.1805 },
  { nom: "Bandraboua", valeur: "Bandraboua", region: "Mayotte", latitude: -12.7176, longitude: 45.1238 },
  { nom: "Tsingoni", valeur: "Tsingoni", region: "Mayotte", latitude: -12.7824, longitude: 45.1334 },
  // Occitanie
  { nom: "Bouzigues", valeur: "Bouzigues", region: "Occitanie", latitude: 43.445, longitude: 3.6563 },
  { nom: "Saint-Guilhem-le-Désert", valeur: "Saint-Guilhem-le-Désert", region: "Occitanie", latitude: 43.7536, longitude: 3.5439 },
];
