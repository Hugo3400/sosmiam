import { creerStockagePhotosAvis, creerStockagePhotosAvisEnMemoire } from "./stockage-photos-avis.ts";

export const DOSSIER_PHOTOS_PROFIL = process.env.DOSSIER_PHOTOS_PROFIL || "/var/lib/sos-miam/photos-profil";

export const creerStockagePhotosProfil = (dossier = DOSSIER_PHOTOS_PROFIL) => creerStockagePhotosAvis(dossier);

export const creerStockagePhotosProfilEnMemoire = creerStockagePhotosAvisEnMemoire;
