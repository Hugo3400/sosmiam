import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_IMAGES_LIEU } from "~/contenus/textes-images-lieu";

export const TEXTES_IMAGES_LIEU_ANGLAIS: Traduction<typeof TEXTES_IMAGES_LIEU> = {
  ligneTitre: "Banner and logo",
  ligneDetail: "Your photo at the top of your listing, and your logo next to your name",
  titre: "Banner and logo",
  retour: "Back",
  intro: "What foodies see first on your listing. Pick a photo – we'll crop it for you.",
  regle: "No alcohol promotion on your images (France's Évin law), and only photos you're allowed to show.",
  banniere: {
    titre: "The banner",
    detail: "At the top of your listing, in wide format: your dining room, your terrace or your signature dish.",
    choisir: "Choose a banner",
    changer: "Change the banner",
    retirer: "Remove the banner",
    vide: "No banner yet – your listing keeps its gradient.",
    envoyee: "Your banner is live! It's on your listing.",
    retiree: "Banner removed.",
    apercu: "Preview of your banner",
  },
  logo: {
    titre: "The logo",
    detail: "A square next to your name, on your listing and in lists.",
    choisir: "Choose a logo",
    changer: "Change the logo",
    retirer: "Remove the logo",
    vide: "No logo yet.",
    envoyee: "Your logo is live! It's on your listing.",
    retiree: "Logo removed.",
    apercu: "Preview of your logo",
  },
  preparation: "Getting your image ready…",
  envoi: "Uploading…",
  galerieFermee: "Your gallery didn't open. Allow access to your photos in your phone's Settings app.",
  illisible: "This image can't be read. Try another one.",
  tropLourde: "This image is still too heavy, even compressed. Try another one.",
};
