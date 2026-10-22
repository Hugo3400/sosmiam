import { readdir, readFile, statfs } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { join } from "node:path";

export type CompteursProcesseur = { total: number; inactif: number };
export type CompteursReseau = { interface: string; recu: number; envoye: number };

export type Instantane = {
  le: number;
  coeurs: number;
  processeur: CompteursProcesseur | null;
  memoire: { total: number; disponible: number } | null;
  echange: { total: number; libre: number } | null;
  disque: { total: number; libre: number; utilise: number } | null;
  reseau: CompteursReseau | null;
  charge: [number, number, number] | null;
  temperature: number | null;
  allumeDepuis: number | null;
};

const enNombres = (morceaux: string[]) => morceaux.map(Number);

export function lireStatProcesseur(texte: string): CompteursProcesseur | null {
  const ligne = texte.split("\n").find((morceau) => morceau.startsWith("cpu "));
  if (!ligne) return null;
  const valeurs = enNombres(ligne.trim().split(/\s+/).slice(1, 9));
  if (valeurs.length < 4 || valeurs.some((valeur) => !Number.isFinite(valeur))) return null;
  return { total: valeurs.reduce((somme, valeur) => somme + valeur, 0), inactif: (valeurs[3] ?? 0) + (valeurs[4] ?? 0) };
}

export function lireInfosMemoire(texte: string) {
  const champ = (nom: string) => {
    const trouve = new RegExp(`^${nom}:\\s+(\\d+) kB`, "m").exec(texte);
    return trouve ? Number(trouve[1]) * 1024 : null;
  };
  const total = champ("MemTotal");
  const disponible = champ("MemAvailable");
  const echangeTotal = champ("SwapTotal");
  const echangeLibre = champ("SwapFree");
  return {
    memoire: total !== null && disponible !== null ? { total, disponible } : null,
    echange: echangeTotal !== null && echangeLibre !== null ? { total: echangeTotal, libre: echangeLibre } : null,
  };
}

export function trouverInterfacePrincipale(route: string): string | null {
  for (const ligne of route.split("\n").slice(1)) {
    const [nom, destination] = ligne.trim().split(/\s+/);
    if (nom && destination === "00000000") return nom;
  }
  return null;
}

export function lireCompteursReseau(texte: string, prefere: string | null): CompteursReseau | null {
  const interfaces: CompteursReseau[] = [];
  for (const ligne of texte.split("\n").slice(2)) {
    const separation = ligne.indexOf(":");
    if (separation < 0) continue;
    const nom = ligne.slice(0, separation).trim();
    const valeurs = enNombres(ligne.slice(separation + 1).trim().split(/\s+/));
    const recu = valeurs[0];
    const envoye = valeurs[8];
    if (!nom || nom === "lo" || recu === undefined || envoye === undefined || !Number.isFinite(recu) || !Number.isFinite(envoye)) continue;
    interfaces.push({ interface: nom, recu, envoye });
  }
  const choisie = interfaces.find((element) => element.interface === prefere);
  if (choisie) return choisie;
  return interfaces.sort((a, b) => b.recu + b.envoye - (a.recu + a.envoye))[0] ?? null;
}

export function lireCharge(texte: string): [number, number, number] | null {
  const [un, cinq, quinze] = enNombres(texte.trim().split(/\s+/).slice(0, 3));
  if (un === undefined || cinq === undefined || quinze === undefined || [un, cinq, quinze].some((valeur) => !Number.isFinite(valeur))) return null;
  return [un, cinq, quinze];
}

async function lireTemperature(racine: string): Promise<number | null> {
  const capteurs = join(racine, "sys/class/hwmon");
  for (const capteur of await readdir(capteurs).catch(() => [] as string[])) {
    const nom = (await readFile(join(capteurs, capteur, "name"), "utf8").catch(() => "")).trim();
    if (nom !== "coretemp" && nom !== "k10temp" && nom !== "cpu_thermal") continue;
    const milli = Number((await readFile(join(capteurs, capteur, "temp1_input"), "utf8").catch(() => "")).trim());
    if (Number.isFinite(milli) && milli > 0) return Math.round(milli / 100) / 10;
  }
  const zones = join(racine, "sys/class/thermal");
  for (const zone of (await readdir(zones).catch(() => [] as string[])).filter((nom) => nom.startsWith("thermal_zone"))) {
    const milli = Number((await readFile(join(zones, zone, "temp"), "utf8").catch(() => "")).trim());
    if (Number.isFinite(milli) && milli > 0) return Math.round(milli / 100) / 10;
  }
  return null;
}

export function creerLecteurMachine({ racine = "/", disque = "/", horloge = () => Date.now() }: { racine?: string; disque?: string; horloge?: () => number } = {}) {
  const lire = (chemin: string) => readFile(join(racine, chemin), "utf8").catch(() => null);
  return async function lireInstantane(): Promise<Instantane> {
    const [stat, infos, route, dev, charge, uptime, systemeFichiers, temperature] = await Promise.all([
      lire("proc/stat"), lire("proc/meminfo"), lire("proc/net/route"), lire("proc/net/dev"), lire("proc/loadavg"), lire("proc/uptime"),
      statfs(disque).catch(() => null), lireTemperature(racine),
    ]);
    const memoire = infos ? lireInfosMemoire(infos) : { memoire: null, echange: null };
    const secondes = uptime ? Number(uptime.trim().split(/\s+/)[0]) : Number.NaN;
    const le = horloge();
    return {
      le,
      coeurs: availableParallelism(),
      processeur: stat ? lireStatProcesseur(stat) : null,
      memoire: memoire.memoire,
      echange: memoire.echange,
      disque: systemeFichiers
        ? { total: systemeFichiers.blocks * systemeFichiers.bsize, libre: systemeFichiers.bavail * systemeFichiers.bsize, utilise: (systemeFichiers.blocks - systemeFichiers.bfree) * systemeFichiers.bsize }
        : null,
      reseau: dev ? lireCompteursReseau(dev, route ? trouverInterfacePrincipale(route) : null) : null,
      charge: charge ? lireCharge(charge) : null,
      temperature,
      allumeDepuis: Number.isFinite(secondes) ? le - Math.round(secondes * 1000) : null,
    };
  };
}
