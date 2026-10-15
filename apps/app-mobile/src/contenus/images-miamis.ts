import type { IdMiami } from "@sos-miam/commun/regles/avatars-miamis";

/**
 * L'image de chaque Miami et du Capitaine : un rond jaune clair de 420 px, transparent autour. Refaites par
 * scripts/avatars-miamis/generer-avatars-miamis.ts, à partir des mêmes dessins que le kit de marque.
 */
export const IMAGES_MIAMIS: Record<IdMiami, number> = {
  toque: require("../../assets/images/avatars-miamis/toque.png"),
  pompon: require("../../assets/images/avatars-miamis/pompon.png"),
  beret: require("../../assets/images/avatars-miamis/beret.png"),
  galette: require("../../assets/images/avatars-miamis/galette.png"),
  paille: require("../../assets/images/avatars-miamis/paille.png"),
  platine: require("../../assets/images/avatars-miamis/platine.png"),
  solaire: require("../../assets/images/avatars-miamis/solaire.png"),
  pirate: require("../../assets/images/avatars-miamis/pirate.png"),
  fiesta: require("../../assets/images/avatars-miamis/fiesta.png"),
  bob: require("../../assets/images/avatars-miamis/bob.png"),
  raclette: require("../../assets/images/avatars-miamis/raclette.png"),
  moustache: require("../../assets/images/avatars-miamis/moustache.png"),
  chantilly: require("../../assets/images/avatars-miamis/chantilly.png"),
  binocles: require("../../assets/images/avatars-miamis/binocles.png"),
  marmotte: require("../../assets/images/avatars-miamis/marmotte.png"),
  tuba: require("../../assets/images/avatars-miamis/tuba.png"),
  capitaine: require("../../assets/images/avatars-miamis/capitaine.png"),
};
