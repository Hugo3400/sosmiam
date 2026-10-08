// Fichiers des publications (vidéos, affiches, photos), rangés sur le serveur sous un nom tiré au hasard.
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

export const DOSSIER_MEDIAS = process.env.DOSSIER_MEDIAS || "/var/lib/sos-miam/medias";

export type TypeMedia = "video" | "affiche" | "photo";

/** Formats acceptés, avec leur signature au début du fichier (on ne se fie pas au seul type annoncé). */
const FORMATS: Record<string, { extension: string; video: boolean; reconnaitre: (debut: Buffer) => boolean }> = {
  "image/jpeg": { extension: "jpg", video: false, reconnaitre: (d) => d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff },
  "image/png": { extension: "png", video: false, reconnaitre: (d) => d.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", video: false, reconnaitre: (d) => d.toString("latin1", 0, 4) === "RIFF" && d.toString("latin1", 8, 12) === "WEBP" },
  "video/mp4": { extension: "mp4", video: true, reconnaitre: (d) => d.toString("latin1", 4, 8) === "ftyp" },
  "video/quicktime": { extension: "mov", video: true, reconnaitre: (d) => d.toString("latin1", 4, 8) === "ftyp" || d.toString("latin1", 4, 8) === "moov" },
  "video/webm": { extension: "webm", video: true, reconnaitre: (d) => d.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
};
const TAILLE_MAX_IMAGE = 15 * 1024 * 1024;
export const TAILLE_MAX_VIDEO = 150 * 1024 * 1024;
const PHOTOS_MAX = 10;

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
