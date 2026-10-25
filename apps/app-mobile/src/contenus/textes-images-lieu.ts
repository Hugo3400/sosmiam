import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_IMAGES_LIEU_ANGLAIS } from "~/contenus/anglais/textes-images-lieu";

export const TEXTES_IMAGES_LIEU = {
  ligneTitre: "Bannière et logo",
  ligneDetail: "Ta photo en haut de ta fiche, et ton logo à côté de ton nom",
  titre: "Bannière et logo",
  retour: "Retour",
  intro: "Ce que les gourmands voient en premier sur ta fiche. Choisis une photo : on la recadre toute seule.",
  regle: "Pas de promotion d'alcool sur tes images (loi Évin), et seulement des photos que tu as le droit de montrer.",
  banniere: {
    titre: "La bannière",
    detail: "En haut de ta fiche, en format large : ta salle, ta terrasse ou ton plat signature.",
    choisir: "Choisir une bannière",
    changer: "Changer la bannière",
    retirer: "Retirer la bannière",
    vide: "Pas encore de bannière : ta fiche garde son dégradé.",
    envoyee: "Bannière en ligne ! Elle apparaît sur ta fiche.",
    retiree: "Bannière retirée.",
    apercu: "Aperçu de ta bannière",
  },
  logo: {
    titre: "Le logo",
    detail: "Un carré à côté de ton nom, sur ta fiche et dans les listes.",
    choisir: "Choisir un logo",
    changer: "Changer le logo",
    retirer: "Retirer le logo",
    vide: "Pas encore de logo.",
    envoyee: "Logo en ligne ! Il apparaît sur ta fiche.",
    retiree: "Logo retiré.",
    apercu: "Aperçu de ton logo",
  },
  preparation: "On prépare ton image…",
  envoi: "Envoi en cours…",
  galerieFermee: "Ta galerie ne s'est pas ouverte. Autorise l'accès aux photos dans les réglages de ton téléphone.",
  illisible: "Cette image ne se lit pas. Essaie avec une autre.",
  tropLourde: "Cette image reste trop lourde, même compressée. Essaie avec une autre.",
  signaler: {
    lien: "Signaler une image",
    quelle: "Quelle image tu signales ?",
    banniere: "La bannière",
    logo: "Le logo",
    sousTitre: { banniere: (lieu: string) => `Bannière de ${lieu}`, logo: (lieu: string) => `Logo de ${lieu}` },
    fermer: "Fermer",
  },
} as const;

export const TEXTES_IMAGES_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_IMAGES_LIEU>> = { fr: TEXTES_IMAGES_LIEU, en: TEXTES_IMAGES_LIEU_ANGLAIS };
