import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";

export const ACTIONS_SERVEUR = ["allumer", "eteindre", "redemarrer"] as const;
export type ActionServeur = (typeof ACTIONS_SERVEUR)[number];

export type ServeurSuivi = { readonly id: string; readonly processus: string; readonly nom: string; readonly pilotable: boolean };

export const SERVEURS_SUIVIS: readonly ServeurSuivi[] = Object.freeze([
  Object.freeze({ id: "app-dev", processus: "sos-miam-app-dev", nom: "Serveur de l'app (Expo et son tunnel)", pilotable: true }),
  Object.freeze({ id: "site-dev", processus: "sos-miam-site-dev", nom: "Site de dev (port 5190)", pilotable: true }),
  Object.freeze({ id: "api", processus: "sos-miam-api", nom: "API (site, app et ce logiciel)", pilotable: false }),
  Object.freeze({ id: "site", processus: "sos-miam-site", nom: "Site en ligne (sosmiam.fr)", pilotable: false }),
  Object.freeze({ id: "bot-discord", processus: "sos-miam-bot-discord", nom: "Bot Discord", pilotable: false }),
]);

const COMMANDES_PM2: Readonly<Record<ActionServeur, string>> = Object.freeze({ allumer: "restart", eteindre: "stop", redemarrer: "restart" });
export const DELAI_LECTURE_PM2 = 10_000;
export const DELAI_ACTION_PM2 = 30_000;
const PROCESSUS_MESURES_MAX = 200;

export type EtatProcessus = "en-ligne" | "arrete" | "en-transition" | "en-erreur" | "absent" | "inconnu";

export type EtatServeur = {
  id: string;
  nom: string;
  processus: string;
  pilotable: boolean;
  etat: EtatProcessus;
  statutPm2: string | null;
  depuis: string | null;
  memoire: number | null;
  processeur: number | null;
  redemarrages: number | null;
};

export type ActionEnCours = { id: string; action: ActionServeur; depuis: string };

export type EtatServeurs = { pm2Repond: boolean; serveurs: EtatServeur[]; actionEnCours: ActionEnCours | null };

export type ErreurPm2 = { erreur: "pm2-introuvable" | "pm2-trop-long" | "pm2-erreur"; message: string | null };

export type ResultatPilotage =
  | { ok: true; serveur: ServeurSuivi; action: ActionServeur; etat: EtatServeur | null }
  | { ok: false; erreur: "serveur-inconnu" }
  | { ok: false; erreur: "lecture-seule" | "action-inconnue" | "deja-allume" | "deja-eteint" | "serveur-absent"; serveur: ServeurSuivi }
  | { ok: false; erreur: "action-en-cours"; serveur: ServeurSuivi; enCours: ActionEnCours }
  | ({ ok: false; serveur: ServeurSuivi; action: ActionServeur } & ErreurPm2);

export type ExecuterPm2 = (arguments_: string[], delai: number) => Promise<string>;
export type MesurerMemoire = (pid: number) => Promise<number | null>;

type ProcessusPm2 = {
  name?: unknown;
  pid?: unknown;
  pm2_env?: { status?: unknown; pm_uptime?: unknown; restart_time?: unknown };
  monit?: { memory?: unknown; cpu?: unknown };
};

function preparerEnvironnementPm2(): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
    HOME: process.env.HOME ?? "/root",
    ...(process.env.PM2_HOME ? { PM2_HOME: process.env.PM2_HOME } : {}),
  };
}

export function creerExecuteurPm2(binaire = "pm2"): ExecuterPm2 {
  return (arguments_, delai) =>
    new Promise((resoudre, rejeter) => {
      execFile(
        binaire,
        arguments_,
        { timeout: delai, killSignal: "SIGKILL", maxBuffer: 16 * 1024 * 1024, env: preparerEnvironnementPm2(), shell: false, windowsHide: true },
        (erreur, sortie, sortieErreur) => {
          if (erreur) return rejeter(Object.assign(erreur, { stderr: String(sortieErreur ?? "") }));
          resoudre(String(sortie));
        },
      );
    });
}

export async function mesurerMemoireArbre(pid: number): Promise<number | null> {
  const vus = new Set<number>();
  const aVisiter = [pid];
  let total = 0;
  while (aVisiter.length > 0 && vus.size < PROCESSUS_MESURES_MAX) {
    const courant = aVisiter.pop() as number;
    if (vus.has(courant)) continue;
    vus.add(courant);
    try {
      const statut = await readFile(`/proc/${courant}/status`, "utf8");
      const rss = /^VmRSS:\s+(\d+)\s+kB/m.exec(statut);
      if (rss) total += Number(rss[1]) * 1024;
      for (const tache of await readdir(`/proc/${courant}/task`)) {
        const enfants = await readFile(`/proc/${courant}/task/${tache}/children`, "utf8").catch(() => "");
        for (const enfant of enfants.split(" ")) if (/^\d+$/.test(enfant)) aVisiter.push(Number(enfant));
      }
    } catch {
      if (courant === pid) return null;
    }
  }
  return total > 0 ? total : null;
}

const CODES_COULEUR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[A-Za-z]`, "g");

function extraireMessagePm2(sortieErreur: string): string | null {
  const ligne = sortieErreur
    .replace(CODES_COULEUR, "")
    .split("\n")
    .map((texte) => texte.trim())
    .find((texte) => texte.startsWith("[PM2][ERROR]"));
  const message = ligne?.slice("[PM2][ERROR]".length).trim().slice(0, 160);
  return message || null;
}

export function traduireErreurPm2(probleme: unknown): ErreurPm2 {
  const erreur = (typeof probleme === "object" && probleme !== null ? probleme : {}) as { code?: unknown; killed?: unknown; signal?: unknown; stderr?: unknown };
  if (erreur.code === "ENOENT" || erreur.code === "EACCES") return { erreur: "pm2-introuvable", message: null };
  if (erreur.killed === true || erreur.signal === "SIGKILL" || erreur.code === "ETIMEDOUT") return { erreur: "pm2-trop-long", message: null };
  return { erreur: "pm2-erreur", message: extraireMessagePm2(typeof erreur.stderr === "string" ? erreur.stderr : "") };
}

function lireListePm2(sortie: string): ProcessusPm2[] {
  const essais = [sortie.trim(), ...sortie.split("\n").reverse().map((ligne) => ligne.trim()).filter((ligne) => ligne.startsWith("["))];
  for (const essai of essais) {
    try {
      const liste = JSON.parse(essai) as unknown;
      if (Array.isArray(liste)) return liste.filter((element): element is ProcessusPm2 => typeof element === "object" && element !== null);
    } catch {
      continue;
    }
  }
  throw Object.assign(new Error("pm2 jlist illisible"), { code: "pm2-illisible" });
}

function traduireStatut(statut: string | null): EtatProcessus {
  if (statut === "online") return "en-ligne";
  if (statut === "stopped") return "arrete";
  if (statut === "errored") return "en-erreur";
  return "en-transition";
}

const lireNombre = (valeur: unknown) => (typeof valeur === "number" && Number.isFinite(valeur) && valeur >= 0 ? valeur : null);

export function creerPiloteServeurs({
  executer = creerExecuteurPm2(),
  mesurerMemoire = mesurerMemoireArbre,
  horloge = () => new Date(),
}: { executer?: ExecuterPm2; mesurerMemoire?: MesurerMemoire; horloge?: () => Date } = {}) {
  let enCours: ActionEnCours | null = null;

  async function lirePm2(): Promise<{ liste: ProcessusPm2[] } | { probleme: ErreurPm2 }> {
    try {
      return { liste: lireListePm2(await executer(["jlist"], DELAI_LECTURE_PM2)) };
    } catch (probleme) {
      return { probleme: traduireErreurPm2(probleme) };
    }
  }

  async function decrire(serveur: ServeurSuivi, liste: ProcessusPm2[] | null): Promise<EtatServeur> {
    const base = { id: serveur.id, nom: serveur.nom, processus: serveur.processus, pilotable: serveur.pilotable };
    if (!liste) return { ...base, etat: "inconnu", statutPm2: null, depuis: null, memoire: null, processeur: null, redemarrages: null };
    const trouve = liste.find((processus) => processus.name === serveur.processus);
    if (!trouve) return { ...base, etat: "absent", statutPm2: null, depuis: null, memoire: null, processeur: null, redemarrages: null };
    const statut = typeof trouve.pm2_env?.status === "string" ? trouve.pm2_env.status : null;
    const etat = traduireStatut(statut);
    const enLigne = etat === "en-ligne";
    const lancement = lireNombre(trouve.pm2_env?.pm_uptime);
    const pid = typeof trouve.pid === "number" && Number.isInteger(trouve.pid) && trouve.pid > 0 ? trouve.pid : null;
    const memoireArbre = enLigne && pid ? await mesurerMemoire(pid).catch(() => null) : null;
    return {
      ...base,
      etat,
      statutPm2: statut,
      depuis: enLigne && lancement ? new Date(lancement).toISOString() : null,
      memoire: enLigne ? memoireArbre ?? lireNombre(trouve.monit?.memory) : null,
      processeur: enLigne ? lireNombre(trouve.monit?.cpu) : null,
      redemarrages: lireNombre(trouve.pm2_env?.restart_time),
    };
  }

  async function lireServeurs(): Promise<EtatServeurs> {
    const lecture = await lirePm2();
    const liste = "liste" in lecture ? lecture.liste : null;
    const serveurs = await Promise.all(SERVEURS_SUIVIS.map((serveur) => decrire(serveur, liste)));
    return { pm2Repond: liste !== null, serveurs, actionEnCours: enCours };
  }

  async function piloterServeur(id: string, demande: string): Promise<ResultatPilotage> {
    const serveur = SERVEURS_SUIVIS.find((suivi) => suivi.id === id);
    if (!serveur) return { ok: false, erreur: "serveur-inconnu" };
    if (!serveur.pilotable) return { ok: false, erreur: "lecture-seule", serveur };
    const action = ACTIONS_SERVEUR.find((possible) => possible === demande);
    if (!action) return { ok: false, erreur: "action-inconnue", serveur };
    if (enCours) return { ok: false, erreur: "action-en-cours", serveur, enCours };
    enCours = { id: serveur.id, action, depuis: horloge().toISOString() };
    try {
      const lecture = await lirePm2();
      if ("probleme" in lecture) return { ok: false, serveur, action, ...lecture.probleme };
      const avant = await decrire(serveur, lecture.liste);
      if (avant.etat === "absent") return { ok: false, erreur: "serveur-absent", serveur };
      if (action === "allumer" && avant.etat === "en-ligne") return { ok: false, erreur: "deja-allume", serveur };
      if (action === "eteindre" && avant.etat === "arrete") return { ok: false, erreur: "deja-eteint", serveur };
      try {
        await executer([COMMANDES_PM2[action], serveur.processus], DELAI_ACTION_PM2);
      } catch (probleme) {
        return { ok: false, serveur, action, ...traduireErreurPm2(probleme) };
      }
      const apres = await lirePm2();
      return { ok: true, serveur, action, etat: "liste" in apres ? await decrire(serveur, apres.liste) : null };
    } finally {
      enCours = null;
    }
  }

  return { lireServeurs, piloterServeur };
}
