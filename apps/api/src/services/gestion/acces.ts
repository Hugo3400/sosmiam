// Qui a le droit d'utiliser le logiciel de gestion : le fichier secret du serveur (hors du dépôt, lisible par root seul),
// rempli par « npm run gestion:autoriser » (scripts/autoriser-poste-gestion.ts). Il est relu dès qu'il change :
// retirer un poste du fichier le coupe aussitôt, sans relancer l'API.
import { readFileSync, statSync } from "node:fs";

import { decoderBase32 } from "../../fonctions/securite/decoder-base32.ts";

export type PosteAutorise = { id: string; nom: string; clePublique: Uint8Array };
export type AccesGestion = { postes: PosteAutorise[]; secretTotp: Uint8Array };

export const FICHIER_ACCES_PAR_DEFAUT = "/root/sos-miam-secrets/gestion.json";

/** Lit le fichier d'accès (null s'il manque, s'il est mal formé, ou s'il est lisible par d'autres que son propriétaire). */
export function creerLecteurAcces(chemin = process.env.FICHIER_GESTION || FICHIER_ACCES_PAR_DEFAUT) {
  let memoire: { modifieLe: number; acces: AccesGestion | null } | null = null;
  return (): AccesGestion | null => {
    let infos;
    try {
      infos = statSync(chemin);
    } catch {
      return null;
    }
    if (memoire && memoire.modifieLe === infos.mtimeMs) return memoire.acces;
    let acces: AccesGestion | null = null;
    if ((infos.mode & 0o077) !== 0) {
      console.error(`${chemin} est lisible par d'autres comptes : logiciel de gestion fermé (chmod 600 ${chemin}).`);
    } else {
      try {
        const brut = JSON.parse(readFileSync(chemin, "utf8"));
        const secretTotp = decoderBase32(String(brut?.totp?.secret ?? ""));
        const postes: PosteAutorise[] = (Array.isArray(brut?.postes) ? brut.postes : []).map((poste: Record<string, unknown>) => ({
          id: String(poste.id),
          nom: String(poste.nom).slice(0, 40),
          clePublique: new Uint8Array(Buffer.from(String(poste.clePublique), "base64url")),
        }));
        if (secretTotp && secretTotp.length >= 16) acces = { postes, secretTotp };
      } catch {
        console.error(`${chemin} est illisible : logiciel de gestion fermé.`);
      }
    }
    memoire = { modifieLe: infos.mtimeMs, acces };
    return acces;
  };
}
