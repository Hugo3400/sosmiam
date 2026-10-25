import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type PosteDistance = { id: string; nom: string; clePublique: string; ajouteLe: string; expireLe: string | null };
export type FichierPostesDistance = { postes: PosteDistance[]; coupes: string[] };
export type RegistrePostesDistance = {
  lire: () => FichierPostesDistance | null;
  ecrire: (fichier: FichierPostesDistance) => void;
};

export const FICHIER_POSTES_DISTANCE = "/root/sos-miam-secrets/gestion-distance.json";

const vide = (): FichierPostesDistance => ({ postes: [], coupes: [] });
const estTexte = (valeur: unknown, longueurMax: number): valeur is string => typeof valeur === "string" && valeur.length > 0 && valeur.length <= longueurMax;

export function lireFichierPostesDistance(brut: unknown): FichierPostesDistance | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { postes, coupes } = brut as { postes?: unknown; coupes?: unknown };
  if (!Array.isArray(postes) || !Array.isArray(coupes) || !coupes.every((id) => estTexte(id, 64))) return null;
  const lus: PosteDistance[] = [];
  for (const poste of postes as Record<string, unknown>[]) {
    const { id, nom, clePublique, ajouteLe, expireLe } = poste ?? {};
    if (!estTexte(id, 64) || !estTexte(nom, 40) || !estTexte(clePublique, 64) || !estTexte(ajouteLe, 40)) return null;
    if (expireLe !== null && !(estTexte(expireLe, 40) && Number.isFinite(Date.parse(expireLe)))) return null;
    lus.push({ id, nom, clePublique, ajouteLe, expireLe });
  }
  return { postes: lus, coupes: coupes as string[] };
}

export function creerRegistrePostesDistance(chemin = process.env.FICHIER_GESTION_DISTANCE || FICHIER_POSTES_DISTANCE): RegistrePostesDistance {
  let memoire: { modifieLe: number; fichier: FichierPostesDistance | null } | null = null;
  return {
    lire() {
      let infos;
      try {
        infos = statSync(chemin);
      } catch (erreur) {
        return (erreur as NodeJS.ErrnoException)?.code === "ENOENT" ? vide() : null;
      }
      if (memoire && memoire.modifieLe === infos.mtimeMs) return memoire.fichier;
      let fichier: FichierPostesDistance | null = null;
      if ((infos.mode & 0o077) !== 0) {
        console.error(`${chemin} est lisible par d'autres comptes : logiciel de gestion fermé (chmod 600 ${chemin}).`);
      } else {
        try {
          fichier = lireFichierPostesDistance(JSON.parse(readFileSync(chemin, "utf8")));
        } catch {
          fichier = null;
        }
        if (!fichier) console.error(`${chemin} est illisible : logiciel de gestion fermé.`);
      }
      memoire = { modifieLe: infos.mtimeMs, fichier };
      return fichier;
    },
    ecrire(fichier) {
      mkdirSync(dirname(chemin), { recursive: true, mode: 0o700 });
      const temporaire = `${chemin}.${process.pid}.tmp`;
      writeFileSync(temporaire, `${JSON.stringify(fichier, null, 2)}\n`, { mode: 0o600 });
      renameSync(temporaire, chemin);
      memoire = { modifieLe: statSync(chemin).mtimeMs, fichier };
    },
  };
}

export function creerRegistrePostesDistanceEnMemoire(depart: FichierPostesDistance = vide()): RegistrePostesDistance {
  let fichier = structuredClone(depart);
  return {
    lire: () => fichier,
    ecrire: (nouveau) => void (fichier = structuredClone(nouveau)),
  };
}
