// Avatars des Miamis, validés par Hugo le 15 octobre 2026 : seize bouées de la Brigade, chacune avec son couvre-chef, au choix
// à côté des emoji. L'avatar d'un compte vaut alors « miami:<id> » (15 caractères au plus : la colonne en garde 16). Le
// Capitaine Bouiboui, avec sa casquette, est réservé au compte officiel SOS Miam : personne ne peut le choisir.
// Les dessins : scripts/avatars-miamis (kit de marque, 06_Avatars_des_Miamis, et images de l'app).

export const PREFIXE_AVATAR_MIAMI = "miami:";

/** Les Miamis au choix, dans l'ordre de la planche validée, avec le nom lu par le lecteur d'écran */
export const AVATARS_MIAMIS = [
  { id: "toque", nom: "Toque" },
  { id: "pompon", nom: "Pompon" },
  { id: "beret", nom: "Béret" },
  { id: "galette", nom: "Galette" },
  { id: "paille", nom: "Paille" },
  { id: "platine", nom: "Platine" },
  { id: "solaire", nom: "Solaire" },
  { id: "pirate", nom: "Pirate" },
  { id: "fiesta", nom: "Fiesta" },
  { id: "bob", nom: "Bob" },
  { id: "raclette", nom: "Raclette" },
  { id: "moustache", nom: "Moustache" },
  { id: "chantilly", nom: "Chantilly" },
  { id: "binocles", nom: "Binocles" },
  { id: "marmotte", nom: "Marmotte" },
  { id: "tuba", nom: "Tuba" },
] as const;

/** Le Capitaine, réservé au compte officiel : reconnu à l'affichage, jamais accepté comme choix d'une personne */
export const AVATAR_CAPITAINE = { id: "capitaine", nom: "Capitaine Bouiboui" } as const;

export type IdMiamiAuChoix = (typeof AVATARS_MIAMIS)[number]["id"];
export type IdMiami = IdMiamiAuChoix | typeof AVATAR_CAPITAINE.id;
