// Espace presse du logiciel de gestion (demandé par Hugo le 14 octobre 2026) : tous les kits et visuels à télécharger.
// Deux sources : presse/ à la racine du dépôt (créations exportées de claude.ai, décrites par presse/index.json : affiches,
// réseaux, imprimés, Miam Safe, textes) et les trois kits médias du site (apps/site-web/kit-media*, chacun avec son zip).
// Chaque fichier a un identifiant tiré de son chemin : on ne télécharge que ce qui est listé, jamais un chemin libre.
import { createHash, randomBytes } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

const RACINE = resolve(import.meta.dirname, "..", "..", "..", "..", "..");
const DOSSIER_PRESSE = resolve(process.env.DOSSIER_PRESSE || join(RACINE, "presse"));
const KITS = [
  { id: "kit-media", titre: "Kit média (le site, les logos, la mascotte)", dossier: join(RACINE, "apps", "site-web", "kit-media") },
  { id: "kit-media-pro", titre: "Kit média pro (affiche et flyers pour les lieux)", dossier: join(RACINE, "apps", "site-web", "kit-media-pro") },
  { id: "kit-media-lieux", titre: "Kit des lieux (autocollants, Miam Safe, posts)", dossier: join(RACINE, "apps", "site-web", "kit-media-lieux") },
];
/** Une image plus lourde n'a pas d'aperçu automatique (seulement « Enregistrer ») */
const APERCU_MAX = 1_500_000;
const IMAGES = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

export const TYPES_PRESSE: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".pdf": "application/pdf", ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".zip": "application/zip",
  ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav",
};

export type FichierPresse = { id: string; nom: string; format: string; dimensions: string | null; octets: number; description: string; apercu: string | null };
export type FamillePresse = { id: string; titre: string; source: "presse" | "site"; zip: { id: string; nom: string; octets: number } | null; fichiers: FichierPresse[] };

type IndexPresse = { genere?: string; familles?: { id: string; titre: string; zip?: string | null; fichiers?: { nom: string; chemin: string; format?: string; taille?: string | null; description?: string; apercu?: string | null }[] }[] };

const identifiant = (chemin: string) => createHash("sha256").update(relative(RACINE, chemin)).digest("base64url").slice(0, 16);
/** Le chemin, s'il reste bien dans son dossier (jamais « ../ ») */
const dans = (dossier: string, chemin: string) => {
  const complet = resolve(dossier, chemin);
  return complet.startsWith(dossier + sep) ? complet : null;
};
const taille = (chemin: string) => stat(chemin).then((s) => (s.isFile() ? s.size : null), () => null);

async function listerDossier(dossier: string): Promise<string[]> {
  const entrees = await readdir(dossier, { withFileTypes: true }).catch(() => []);
  const fichiers = await Promise.all(entrees.map((e) => (e.isDirectory() ? listerDossier(join(dossier, e.name)) : e.isFile() ? [join(dossier, e.name)] : [])));
  return fichiers.flat().sort();
}

/** Toutes les familles, et la table « identifiant → chemin » des fichiers téléchargeables (fichiers, aperçus, zips) */
async function lireTout() {
  const chemins = new Map<string, string>();
  const noter = (chemin: string) => {
    const id = identifiant(chemin);
    chemins.set(id, chemin);
    return id;
  };
  const familles: FamillePresse[] = [];
  const index = await readFile(join(DOSSIER_PRESSE, "index.json"), "utf8").then((t) => JSON.parse(t) as IndexPresse, () => null);
  for (const famille of index?.familles ?? []) {
    const fichiers: FichierPresse[] = [];
    for (const f of famille.fichiers ?? []) {
      const chemin = dans(DOSSIER_PRESSE, f.chemin);
      const octets = chemin ? await taille(chemin) : null;
      if (!chemin || octets === null || !TYPES_PRESSE[extname(chemin).toLowerCase()]) continue;
      const apercu = f.apercu ? dans(DOSSIER_PRESSE, f.apercu) : null;
      fichiers.push({
        id: noter(chemin), nom: f.nom, format: f.format ?? extname(chemin).slice(1).toUpperCase(), dimensions: f.taille ?? null, octets,
        description: f.description ?? "", apercu: apercu && (await taille(apercu)) !== null ? noter(apercu) : null,
      });
    }
    const zip = famille.zip ? dans(DOSSIER_PRESSE, famille.zip) : null;
    const octetsZip = zip ? await taille(zip) : null;
    familles.push({ id: famille.id, titre: famille.titre, source: "presse", zip: zip && octetsZip !== null ? { id: noter(zip), nom: famille.zip!.split("/").pop()!, octets: octetsZip } : null, fichiers });
  }
  for (const kit of KITS) {
    const tous = await listerDossier(kit.dossier);
    if (tous.length === 0) continue;
    const zip = tous.find((chemin) => chemin.endsWith(".zip")) ?? null;
    const fichiers: FichierPresse[] = [];
    for (const chemin of tous.filter((c) => c !== zip && TYPES_PRESSE[extname(c).toLowerCase()])) {
      const octets = (await taille(chemin)) ?? 0;
      const id = noter(chemin);
      const extension = extname(chemin).toLowerCase();
      fichiers.push({
        id, nom: chemin.split(sep).pop()!, format: extension.slice(1).toUpperCase(), dimensions: null, octets,
        description: relative(kit.dossier, chemin).split(sep).slice(0, -1).join(" · "), apercu: IMAGES.has(extension) && octets <= APERCU_MAX ? id : null,
      });
    }
    familles.push({ id: kit.id, titre: kit.titre, source: "site", zip: zip ? { id: noter(zip), nom: zip.split(sep).pop()!, octets: (await taille(zip)) ?? 0 } : null, fichiers });
  }
  return { genere: index?.genere ?? null, familles, chemins };
}

/** Liens de téléchargement des gros fichiers (vidéos, zip des vidéos) : ouverts dans le navigateur, valables 10 minutes */
const DUREE_LIEN = 10 * 60_000;
const liens = new Map<string, { id: string; expire: number }>();

/** Un lien temporaire pour un fichier listé, à ouvrir dans le navigateur (trop lourd pour passer par le logiciel) ; null sinon */
export async function creerLienPresse(id: string, maintenant = Date.now()) {
  if (!(await trouverFichierPresse(id))) return null;
  for (const [jeton, lien] of liens) if (lien.expire < maintenant) liens.delete(jeton);
  const jeton = randomBytes(24).toString("base64url");
  liens.set(jeton, { id, expire: maintenant + DUREE_LIEN });
  return { jeton, expireLe: new Date(maintenant + DUREE_LIEN) };
}

/** Le fichier d'un lien temporaire encore valable ; null sinon */
export async function lireLienPresse(jeton: string, maintenant = Date.now()) {
  const lien = liens.get(jeton);
  if (!lien || lien.expire < maintenant) return null;
  return trouverFichierPresse(lien.id);
}

/** GET /presse : les familles et leurs fichiers (sans les chemins) */
export async function listerPresse() {
  const { genere, familles } = await lireTout();
  return { genere, familles };
}

/** Le fichier d'un identifiant listé (fichier, aperçu ou zip) ; null sinon */
export async function trouverFichierPresse(id: string) {
  const chemin = (await lireTout()).chemins.get(id);
  if (!chemin) return null;
  return { chemin, nom: chemin.split(sep).pop()!, type: TYPES_PRESSE[extname(chemin).toLowerCase()] ?? "application/octet-stream" };
}
