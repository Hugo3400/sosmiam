// Fichiers acceptés pour les publications : formats reconnus à leur signature, poids et nombre maximums.
/** Formats acceptés, avec leur signature au début du fichier (on ne se fie pas au seul type annoncé). */
export const FORMATS: Record<string, { extension: string; video: boolean; reconnaitre: (debut: Buffer) => boolean }> = {
  "image/jpeg": { extension: "jpg", video: false, reconnaitre: (d) => d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff },
  "image/png": { extension: "png", video: false, reconnaitre: (d) => d.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", video: false, reconnaitre: (d) => d.toString("latin1", 0, 4) === "RIFF" && d.toString("latin1", 8, 12) === "WEBP" },
  "video/mp4": { extension: "mp4", video: true, reconnaitre: (d) => d.toString("latin1", 4, 8) === "ftyp" },
  "video/quicktime": { extension: "mov", video: true, reconnaitre: (d) => d.toString("latin1", 4, 8) === "ftyp" || d.toString("latin1", 4, 8) === "moov" },
  "video/webm": { extension: "webm", video: true, reconnaitre: (d) => d.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
};
export const TAILLE_MAX_IMAGE = 15 * 1024 * 1024;
export const TAILLE_MAX_VIDEO = 150 * 1024 * 1024;
export const PHOTOS_MAX = 10;
