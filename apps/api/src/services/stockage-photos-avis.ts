import { randomUUID } from "node:crypto";
import { chmod, mkdir, open, readdir, readFile, stat, statfs, unlink } from "node:fs/promises";
import { join } from "node:path";

export const DOSSIER_PHOTOS_AVIS = process.env.DOSSIER_PHOTOS_AVIS || "/var/lib/sos-miam/photos-avis";
export const FORME_PHOTO_AVIS = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpg$/;
const FORME_PHOTO_PNG = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/;

export type ExtensionPhoto = "jpg" | "png";

export type FichePhotoAvis = { compteId: number; deposeLe: Date };
export type PhotoAvisRangee = { photo: string; deposeLe: Date };

export type StockagePhotosAvis = {
  tirerNom: () => string;
  ecrire: (photo: string, octets: Uint8Array, fiche: FichePhotoAvis) => Promise<void>;
  existe: (photo: string) => Promise<boolean>;
  lire: (photo: string) => Promise<Buffer | null>;
  lireFiche: (photo: string) => Promise<FichePhotoAvis | null>;
  supprimer: (photos: readonly string[]) => Promise<number>;
  lister: (apres: string | null, nombre: number) => Promise<PhotoAvisRangee[]>;
  lirePartLibre: () => Promise<number>;
};

export type DisquePhotosAvis = {
  chmod: typeof chmod;
  mkdir: typeof mkdir;
  open: typeof open;
  readdir: typeof readdir;
  readFile: typeof readFile;
  stat: typeof stat;
  statfs: typeof statfs;
  unlink: typeof unlink;
};
const DISQUE: DisquePhotosAvis = { chmod, mkdir, open, readdir, readFile, stat, statfs, unlink };
const SYNC_DOSSIER_IMPOSSIBLE = new Set(["EINVAL", "ENOTSUP", "EOPNOTSUPP"]);

function creerNoms(extension: ExtensionPhoto) {
  const forme = extension === "png" ? FORME_PHOTO_PNG : FORME_PHOTO_AVIS;
  const estNomValide = (photo: unknown): photo is string => typeof photo === "string" && forme.test(photo);
  return {
    tirerNom: () => `${randomUUID()}.${extension}`,
    estNomValide,
    nomFiche: (photo: string) => photo.replace(/\.(?:jpg|png)$/, ".json"),
    exigerNom: (photo: string) => {
      if (!estNomValide(photo)) throw new Error("Nom de photo refusé (seuls les noms tirés par l'API passent)");
      return photo;
    },
    ordonner: (noms: readonly string[], apres: string | null, nombre: number) => {
      const photos = new Set<string>();
      for (const nom of noms) {
        const photo = nom.replace(/\.json$/, `.${extension}`);
        if (estNomValide(photo) && (apres === null || photo > apres)) photos.add(photo);
      }
      return [...photos].sort().slice(0, Math.max(0, Math.floor(nombre)));
    },
  };
}
const codeErreur = (erreur: unknown) => (erreur as NodeJS.ErrnoException | null)?.code;
const ignorerAbsent = (erreur: unknown) => {
  if (codeErreur(erreur) !== "ENOENT") throw erreur;
  return null;
};

function lireFicheTexte(texte: string): FichePhotoAvis | null {
  try {
    const brut = JSON.parse(texte) as { compteId?: unknown; deposeLe?: unknown };
    const deposeLe = typeof brut.deposeLe === "string" ? new Date(brut.deposeLe) : null;
    if (!Number.isSafeInteger(brut.compteId) || !deposeLe || Number.isNaN(deposeLe.getTime())) return null;
    return { compteId: brut.compteId as number, deposeLe };
  } catch {
    return null;
  }
}

const ecrireFicheTexte = (fiche: FichePhotoAvis) => JSON.stringify({ compteId: fiche.compteId, deposeLe: fiche.deposeLe.toISOString() });

async function forcerDossier(dossier: string, ouvrir: DisquePhotosAvis["open"]): Promise<void> {
  const poignee = await ouvrir(dossier, "r");
  try {
    await poignee.sync();
  } catch (erreur) {
    if (!SYNC_DOSSIER_IMPOSSIBLE.has(codeErreur(erreur) ?? "")) throw erreur;
  } finally {
    await poignee.close();
  }
}

async function ecrireForce(chemin: string, octets: Uint8Array | string, ouvrir: DisquePhotosAvis["open"]): Promise<void> {
  const poignee = await ouvrir(chemin, "wx", 0o600);
  try {
    await poignee.writeFile(octets);
    await poignee.sync();
  } finally {
    await poignee.close();
  }
}

export function creerStockagePhotosAvis(dossier = DOSSIER_PHOTOS_AVIS, o: { disque?: Partial<DisquePhotosAvis>; extension?: ExtensionPhoto } = {}): StockagePhotosAvis {
  const fs: DisquePhotosAvis = { ...DISQUE, ...o.disque };
  const { tirerNom, estNomValide, nomFiche, exigerNom, ordonner: ordonnerPhotos } = creerNoms(o.extension ?? "jpg");
  let preparation: Promise<void> | null = null;
  const preparer = () => {
    preparation ??= (async () => {
      await fs.mkdir(dossier, { recursive: true, mode: 0o700 });
      await fs.chmod(dossier, 0o700);
    })().catch((erreur: unknown) => {
      preparation = null;
      throw erreur;
    });
    return preparation;
  };
  const chemin = (nom: string) => join(dossier, nom);
  const lireFiche = async (photo: string) => {
    if (!estNomValide(photo)) return null;
    const texte = await fs.readFile(chemin(nomFiche(photo)), "utf8").catch(ignorerAbsent);
    return texte === null ? null : lireFicheTexte(texte);
  };
  const dateDuDisque = async (photo: string) => {
    for (const nom of [photo, nomFiche(photo)]) {
      const infos = await fs.stat(chemin(nom)).catch(ignorerAbsent);
      if (infos) return infos.mtime;
    }
    return null;
  };

  return {
    tirerNom,
    ecrire: async (photo, octets, fiche) => {
      const cible = chemin(exigerNom(photo));
      const cibleFiche = chemin(nomFiche(photo));
      await preparer();
      try {
        await ecrireForce(cibleFiche, ecrireFicheTexte(fiche), fs.open);
        await ecrireForce(cible, octets, fs.open);
        await forcerDossier(dossier, fs.open);
      } catch (erreur) {
        if (codeErreur(erreur) !== "EEXIST") await Promise.all([cible, cibleFiche].map((c) => fs.unlink(c).catch(() => undefined)));
        throw erreur;
      }
    },
    existe: async (photo) => estNomValide(photo) && (await fs.stat(chemin(photo)).catch(ignorerAbsent)) !== null,
    lire: async (photo) => (estNomValide(photo) ? fs.readFile(chemin(photo)).catch(ignorerAbsent) : null),
    lireFiche,
    supprimer: async (photos) => {
      let supprimees = 0;
      for (const photo of new Set(photos.filter(estNomValide))) {
        const [image] = await Promise.all([photo, nomFiche(photo)].map((nom) => fs.unlink(chemin(nom)).then(() => true, (e: unknown) => ignorerAbsent(e) ?? false)));
        if (image) supprimees += 1;
      }
      return supprimees;
    },
    lister: async (apres, nombre) => {
      const noms = await fs.readdir(dossier).catch(ignorerAbsent);
      const rangees: PhotoAvisRangee[] = [];
      for (const photo of ordonnerPhotos(noms ?? [], apres, nombre)) {
        const deposeLe = (await lireFiche(photo))?.deposeLe ?? (await dateDuDisque(photo));
        if (deposeLe) rangees.push({ photo, deposeLe });
      }
      return rangees;
    },
    lirePartLibre: async () => {
      try {
        await preparer();
        const disque = await fs.statfs(dossier);
        return disque.blocks > 0 ? Math.min(1, Math.max(0, disque.bavail / disque.blocks)) : 0;
      } catch {
        return 0;
      }
    },
  };
}

export type StockagePhotosAvisEnMemoire = StockagePhotosAvis & {
  fichiers: Map<string, { octets: Buffer | null; fiche: FichePhotoAvis | null; modifieLe: Date }>;
  reglerPartLibre: (part: number) => void;
};

export function creerStockagePhotosAvisEnMemoire(o: { partLibre?: number; horloge?: () => number; extension?: ExtensionPhoto } = {}): StockagePhotosAvisEnMemoire {
  const horloge = o.horloge ?? Date.now;
  const { tirerNom, estNomValide, exigerNom, ordonner: ordonnerPhotos } = creerNoms(o.extension ?? "jpg");
  const fichiers: StockagePhotosAvisEnMemoire["fichiers"] = new Map();
  let partLibre = o.partLibre ?? 1;
  return {
    fichiers,
    reglerPartLibre: (part) => void (partLibre = part),
    tirerNom,
    ecrire: async (photo, octets, fiche) => {
      if (fichiers.has(exigerNom(photo))) throw Object.assign(new Error("Cette photo d'avis existe déjà"), { code: "EEXIST" });
      fichiers.set(photo, { octets: Buffer.from(octets), fiche: { ...fiche }, modifieLe: new Date(horloge()) });
    },
    existe: async (photo) => estNomValide(photo) && Boolean(fichiers.get(photo)?.octets),
    lire: async (photo) => {
      const octets = estNomValide(photo) ? fichiers.get(photo)?.octets : null;
      return octets ? Buffer.from(octets) : null;
    },
    lireFiche: async (photo) => {
      const fiche = estNomValide(photo) ? fichiers.get(photo)?.fiche : null;
      return fiche ? { ...fiche } : null;
    },
    supprimer: async (photos) => [...new Set(photos.filter(estNomValide))].filter((photo) => {
      const avait = Boolean(fichiers.get(photo)?.octets);
      fichiers.delete(photo);
      return avait;
    }).length,
    lister: async (apres, nombre) => ordonnerPhotos([...fichiers.keys()], apres, nombre).map((photo) => {
      const f = fichiers.get(photo)!;
      return { photo, deposeLe: f.fiche?.deposeLe ?? f.modifieLe };
    }),
    lirePartLibre: async () => partLibre,
  };
}
