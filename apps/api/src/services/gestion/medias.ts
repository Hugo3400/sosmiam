// Fichiers des publications (vidéos, affiches, photos), rangés sur le serveur sous un nom tiré au hasard.
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { FORMATS, PHOTOS_MAX, TAILLE_MAX_IMAGE, TAILLE_MAX_VIDEO } from "./formats-medias.ts";

export const DOSSIER_MEDIAS = process.env.DOSSIER_MEDIAS || "/var/lib/sos-miam/medias";

export type TypeMedia = "video" | "affiche" | "photo";


export type ErreurMedia = "format-refuse" | "fichier-trop-lourd" | "publication-introuvable" | "melange-video-photos" | "trop-de-photos";

/**
 * Ajoute un fichier à une publication. Une publication a soit une vidéo (et son affiche), soit des photos (10 au plus) :
 * une nouvelle vidéo ou une nouvelle affiche remplace l'ancienne.
 */
export async function ajouterMedia(publicationId: number, type: TypeMedia, typeMime: string, contenu: Buffer) {
  const format = FORMATS[typeMime];
  if (!format || format.video !== (type === "video") || !format.reconnaitre(contenu)) return { erreur: "format-refuse" as ErreurMedia };
  if (contenu.length > (format.video ? TAILLE_MAX_VIDEO : TAILLE_MAX_IMAGE)) return { erreur: "fichier-trop-lourd" as ErreurMedia };
  const publication = await baseDeDonnees.publication.findUnique({ where: { id: publicationId }, select: { medias: true } });
  if (!publication) return { erreur: "publication-introuvable" as ErreurMedia };
  const photos = publication.medias.filter((media) => media.type === "photo");
  if (type === "photo" ? publication.medias.some((media) => media.type !== "photo") : photos.length > 0) {
    return { erreur: "melange-video-photos" as ErreurMedia };
  }
  if (type === "photo" && photos.length >= PHOTOS_MAX) return { erreur: "trop-de-photos" as ErreurMedia };

  const fichier = `${randomUUID()}.${format.extension}`;
  await mkdir(DOSSIER_MEDIAS, { recursive: true, mode: 0o755 });
  await writeFile(join(DOSSIER_MEDIAS, fichier), contenu, { mode: 0o644 });
  const remplaces = type === "photo" ? [] : publication.medias.filter((media) => media.type === type);
  const media = await baseDeDonnees.$transaction(async (transaction) => {
    if (remplaces.length > 0) await transaction.mediaPublication.deleteMany({ where: { id: { in: remplaces.map((m) => m.id) } } });
    return transaction.mediaPublication.create({
      data: { publicationId, type, fichier, typeMime, taille: contenu.length, ordre: type === "photo" ? photos.length : 0 },
    });
  });
  await supprimerFichiersMedias(remplaces.map((m) => m.fichier));
  return { media };
}

/** Retire un fichier d'une publication. Faux s'il n'en fait pas partie. */
export async function retirerMedia(publicationId: number, mediaId: number): Promise<boolean> {
  const media = await baseDeDonnees.mediaPublication.findFirst({ where: { id: mediaId, publicationId } });
  if (!media) return false;
  await baseDeDonnees.mediaPublication.delete({ where: { id: mediaId } });
  await supprimerFichiersMedias([media.fichier]);
  return true;
}

/** Chemin d'un fichier de média connu de la base (null sinon : on ne sert jamais un nom inventé). */
export async function trouverFichierMedia(fichier: string) {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]{2,4}$/.test(fichier)) return null;
  const media = await baseDeDonnees.mediaPublication.findUnique({ where: { fichier }, select: { typeMime: true } });
  return media ? { chemin: join(DOSSIER_MEDIAS, fichier), typeMime: media.typeMime } : null;
}

export async function supprimerFichiersMedias(fichiers: string[]) {
  await Promise.all(fichiers.map((fichier) => rm(join(DOSSIER_MEDIAS, fichier), { force: true })));
}
