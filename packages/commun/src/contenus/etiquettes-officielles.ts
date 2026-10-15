import type { FamilleEtiquettesOfficielles } from "../types/etiquette.ts";

export const FAMILLES_ETIQUETTES: readonly FamilleEtiquettesOfficielles[] = [
  {
    id: "assiette",
    nom: "Assiette",
    etiquettes: ["Vegan", "Végétarien", "Flexitarien", "Halal", "Casher", "Sans gluten", "Sans lactose", "Sans porc", "Poisson et fruits de mer", "Street food", "Fait maison", "Sucré", "Épicé"],
  },
  {
    id: "ambiance",
    nom: "Ambiance",
    etiquettes: ["LGBT+ friendly", "Calme", "Festif", "Chill", "Timides bienvenus", "Première sortie solo", "Jeux de société", "Brunch", "Pique-nique", "Afterwork", "Découverte", "Fait-main"],
  },
  {
    id: "pratique",
    nom: "Pratique",
    etiquettes: ["Petit budget", "Sans alcool", "Accessible en fauteuil", "Animaux bienvenus", "Près des transports", "Parking facile", "En anglais", "En espagnol", "En langue des signes", "Calme pour les oreilles"],
  },
  {
    id: "public",
    nom: "Public",
    etiquettes: ["Nouveaux arrivants", "Étudiants", "Jeunes actifs", "Parents", "Télétravailleurs", "Internationaux", "Solo"],
  },
];

export const ETIQUETTES_FILTRE_EXPLORER: readonly string[] = ["Vegan", "Végétarien", "Accessible en fauteuil", "LGBT+ friendly", "Petit budget", "Sans alcool", "Halal", "Calme"];
