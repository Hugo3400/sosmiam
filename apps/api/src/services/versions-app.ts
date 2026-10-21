import { readFileSync, statSync } from "node:fs";

import type { VersionMinimaleApp } from "../controleurs/app.ts";
import { lireVersionApp } from "../fonctions/texte/lire-version-app.ts";

export const FICHIER_VERSIONS_APP = process.env.FICHIER_VERSIONS_APP || "/var/lib/sos-miam/versions-app.json";

export type VersionsApp = { minimale: VersionMinimaleApp; derniere: VersionMinimaleApp };

function lireVersionsSysteme(valeur: unknown, defaut: VersionMinimaleApp): VersionMinimaleApp {
  const versions = valeur && typeof valeur === "object" ? (valeur as Record<string, unknown>) : {};
  return { ios: lireVersionApp(versions.ios, defaut.ios), android: lireVersionApp(versions.android, defaut.android) };
}

export function creerVersionsApp(fichier: string, parDefaut: VersionsApp) {
  let dernierLu: { modifieLe: number; versions: VersionsApp } | null = null;

  function lire(): VersionsApp {
    let modifieLe: number;
    try {
      modifieLe = statSync(fichier).mtimeMs;
    } catch {
      dernierLu = null;
      return parDefaut;
    }
    if (dernierLu && dernierLu.modifieLe === modifieLe) return dernierLu.versions;
    try {
      const brut = JSON.parse(readFileSync(fichier, "utf8")) as Record<string, unknown> | null;
      const versions = { minimale: lireVersionsSysteme(brut?.minimale, parDefaut.minimale), derniere: lireVersionsSysteme(brut?.derniere, parDefaut.derniere) };
      dernierLu = { modifieLe, versions };
      return versions;
    } catch {
      return parDefaut;
    }
  }

  return { minimale: () => lire().minimale, derniere: () => lire().derniere };
}
