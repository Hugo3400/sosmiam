import type { EtiquetteLieu } from "@sos-miam/commun/types/etiquette";

const confirmee = (nom: string): EtiquetteLieu => ({ nom, statut: "confirmee", propositions: 0, parToi: false });
const proposee = (nom: string, propositions: number): EtiquetteLieu => ({ nom, statut: "proposee", propositions, parToi: false });

export const ETIQUETTES_LIEUX_EXEMPLES: Readonly<Record<number, readonly EtiquetteLieu[]>> = {
  0: [confirmee("Fait maison"), confirmee("Végétarien"), confirmee("Accessible en fauteuil"), proposee("Calme", 6)],
  1: [confirmee("Sucré"), confirmee("Sans gluten"), proposee("Brunch", 4)],
  2: [confirmee("Jeux de société"), proposee("Festif", 3)],
  3: [confirmee("Street food"), confirmee("Petit budget"), proposee("Épicé", 5), proposee("Vegan", 2)],
  4: [confirmee("Vegan"), confirmee("Sans alcool"), confirmee("Calme"), confirmee("LGBT+ friendly")],
  5: [proposee("Afterwork", 7), proposee("Près des transports", 2)],
  6: [confirmee("Animaux bienvenus"), proposee("Découverte", 3)],
  7: [confirmee("En anglais"), proposee("Timides bienvenus", 4)],
  8: [proposee("Découverte", 2)],
  9: [confirmee("Poisson et fruits de mer"), confirmee("Halal"), proposee("Petit budget", 8)],
  10: [proposee("Sucré", 5), proposee("Petit budget", 3)],
  11: [confirmee("Fait maison"), proposee("Étudiants", 2)],
  12: [confirmee("Animaux bienvenus"), confirmee("Parking facile")],
  13: [confirmee("Poisson et fruits de mer"), proposee("Calme", 2), proposee("Accessible en fauteuil", 1)],
  14: [confirmee("Festif"), proposee("Sans porc", 2)],
  15: [proposee("Sucré", 3), proposee("Halal", 2)],
  16: [confirmee("Végétarien"), confirmee("Halal"), confirmee("Près des transports")],
  17: [confirmee("Calme pour les oreilles"), proposee("LGBT+ friendly", 4)],
};
