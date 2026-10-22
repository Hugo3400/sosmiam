import { appeler } from "./client-gestion.ts";

export type PaireVersions = { ios: string; android: string };
export type VersionsApp = { minimale: PaireVersions; derniere: PaireVersions };

export const lireVersionsApp = () => appeler<VersionsApp & { fichier: boolean }>("GET", "/versions-app");
export const ecrireVersionsApp = (versions: VersionsApp) => appeler<{ ok: true } & VersionsApp>("PUT", "/versions-app", { corps: versions });
