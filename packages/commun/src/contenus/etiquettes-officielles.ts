import type { FamilleEtiquette, FamilleEtiquettesOfficielles } from "../types/etiquette.ts";
import type { ParLangue } from "../types/traduction.ts";
import { NOMS_ETIQUETTES_OFFICIELLES_ANGLAIS, NOMS_FAMILLES_ETIQUETTES_ANGLAIS } from "./anglais/etiquettes-officielles.ts";

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

export const NOMS_FAMILLES_ETIQUETTES_PAR_LANGUE: ParLangue<Readonly<Record<FamilleEtiquette, string>>> = {
  fr: Object.fromEntries(FAMILLES_ETIQUETTES.map((famille) => [famille.id, famille.nom])) as Record<FamilleEtiquette, string>,
  en: NOMS_FAMILLES_ETIQUETTES_ANGLAIS,
};

export const NOMS_ETIQUETTES_OFFICIELLES_PAR_LANGUE: ParLangue<Readonly<Record<string, string>>> = {
  fr: Object.fromEntries(FAMILLES_ETIQUETTES.flatMap((famille) => famille.etiquettes).map((nom) => [nom, nom])),
  en: NOMS_ETIQUETTES_OFFICIELLES_ANGLAIS,
};
