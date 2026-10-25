export type ImageLieu = "banniere" | "logo";

export const IMAGES_LIEU: readonly ImageLieu[] = ["banniere", "logo"];

export const BANNIERE_LIEU = { largeur: 1600, hauteur: 500, poidsMax: 600 * 1024, type: "image/jpeg", extension: "jpg" } as const;

export const LOGO_LIEU = { largeur: 512, hauteur: 512, poidsMax: 1024 * 1024, type: "image/png", extension: "png" } as const;

export const REGLES_IMAGES_LIEU = { banniere: BANNIERE_LIEU, logo: LOGO_LIEU } as const;

export const CHEMIN_IMAGES_LIEU = "/app/lieux/images";

export const FORME_NOM_IMAGE_LIEU = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png)$/;
