import { open } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type NiveauLigne = "info" | "avert" | "erreur";
export type FluxJournal = "sortie" | "erreurs";
export type SorteJournal = "pm2" | "nginx";
export type LigneJournal = { heure: string | null; niveau: NiveauLigne; texte: string; flux: FluxJournal };
export type FichierJournal = { chemin: string; flux: FluxJournal; sorte: SorteJournal };
export type SourceJournal = { id: string; nom: string; fichiers: FichierJournal[] };

const OCTETS_LUS = 256 * 1024;
const LIGNES_MAX = 400;
const LONGUEUR_MAX = 600;
const LONGUEUR_LUE = LONGUEUR_MAX + 400;
const UNE_HEURE = 3_600_000;
const MASQUE = "•••";

function dossierPm2() {
  if (process.env.DOSSIER_JOURNAUX_PM2) return process.env.DOSSIER_JOURNAUX_PM2;
  return join(process.env.PM2_HOME || join(homedir(), ".pm2"), "logs");
}

const dossierNginx = () => process.env.DOSSIER_JOURNAUX_NGINX || "/var/log/nginx";

function programme(id: string, nom: string, processus: string): SourceJournal {
  return {
    id,
    nom,
    fichiers: [
      { chemin: join(dossierPm2(), `${processus}-out.log`), flux: "sortie", sorte: "pm2" },
      { chemin: join(dossierPm2(), `${processus}-error.log`), flux: "erreurs", sorte: "pm2" },
    ],
  };
}

export function listerSourcesConnues(): SourceJournal[] {
  return [
    programme("api", "API", "sos-miam-api"),
    programme("site", "Site en ligne", "sos-miam-site"),
    programme("bot-discord", "Bot Discord", "sos-miam-bot-discord"),
    programme("app-dev", "Serveur de l'app", "sos-miam-app-dev"),
    programme("site-dev", "Site de dev", "sos-miam-site-dev"),
    {
      id: "nginx",
      nom: "nginx · erreurs",
      fichiers: [
        { chemin: join(dossierNginx(), "sosmiam.error.log"), flux: "erreurs", sorte: "nginx" },
        { chemin: join(dossierNginx(), "sosmiam-api.error.log"), flux: "erreurs", sorte: "nginx" },
      ],
    },
  ];
}

export function masquerLigne(texte: string): string {
  return texte
    .replace(/(Bearer|Basic)\s+[^\s"',;]+/gi, `$1 ${MASQUE}`)
    .replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g, `$1${MASQUE}@$2`)
    .replace(/\?[^\s"']+/g, `?${MASQUE}`)
    .replace(/\b(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}\b/g, (tout, a: string, b: string) => (a === "127" ? tout : `${a}.${b}.${MASQUE}`))
    .replace(/(?<![\w:])[0-9a-f]{0,4}(?::[0-9a-f]{0,4}){2,7}(?![\w:])/gi, (tout) => (tout.includes("::") || tout.split(":").length >= 5 ? MASQUE : tout))
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, MASQUE);
}

const HORODATAGE_PM2 = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?:?\s+/;
const LIGNE_NGINX = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2}) \[(\w+)\] \d+#\d+: (?:\*\d+ )?/;
const CODES_COULEUR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[A-Za-z]`, "g");
const NIVEAUX_NGINX: Readonly<Record<string, NiveauLigne>> = Object.freeze({ emerg: "erreur", alert: "erreur", crit: "erreur", error: "erreur", warn: "avert", notice: "info", info: "info", debug: "info" });

function niveauSortie(texte: string): NiveauLigne {
  const http = / ([1-5]\d\d) - [\d.]+ ms$/.exec(texte);
  if (http?.[1]?.startsWith("5")) return "erreur";
  if (http?.[1]?.startsWith("4")) return "avert";
  return "info";
}

function niveauErreur(texte: string): NiveauLigne {
  return /^\(node:\d+\) \w*Warning|^Warning\b|^\s*avertissement/i.test(texte) ? "avert" : "erreur";
}

export function analyserLigne(brute: string, fichier: Pick<FichierJournal, "flux" | "sorte">): LigneJournal | null {
  const tronquee = brute.length > LONGUEUR_LUE;
  const espace = tronquee ? brute.lastIndexOf(" ", LONGUEUR_LUE) : -1;
  const debut = tronquee ? (espace > LONGUEUR_LUE / 2 ? brute.slice(0, espace) : brute.slice(0, LONGUEUR_LUE).replace(/\S{1,120}$/, "")) : brute;
  const propre = debut.replace(CODES_COULEUR, "").trimEnd();
  if (!propre.trim()) return null;
  let heure: string | null = null;
  let texte = propre;
  let niveau: NiveauLigne;
  if (fichier.sorte === "nginx") {
    const trouve = LIGNE_NGINX.exec(propre);
    if (trouve) {
      const [, annee, mois, jour, h, m, s, gravite] = trouve;
      heure = new Date(Number(annee), Number(mois) - 1, Number(jour), Number(h), Number(m), Number(s)).toISOString();
      texte = propre.slice(trouve[0].length);
      niveau = NIVEAUX_NGINX[gravite ?? ""] ?? "erreur";
    } else niveau = "erreur";
  } else {
    const trouve = HORODATAGE_PM2.exec(propre);
    if (trouve) {
      const date = new Date(`${trouve[1]}T${trouve[2]}${trouve[3] ?? ""}`);
      if (!Number.isNaN(date.getTime())) heure = date.toISOString();
      texte = propre.slice(trouve[0].length);
    }
    niveau = fichier.flux === "erreurs" ? niveauErreur(texte) : niveauSortie(texte);
  }
  const masque = masquerLigne(texte);
  return { heure, niveau, flux: fichier.flux, texte: tronquee || masque.length > LONGUEUR_MAX ? `${masque.slice(0, LONGUEUR_MAX)}…` : masque };
}

export async function lireFinFichier(chemin: string, octets = OCTETS_LUS): Promise<string[] | null> {
  let poignee;
  try {
    poignee = await open(chemin, "r");
  } catch {
    return null;
  }
  try {
    const { size } = await poignee.stat();
    const debut = Math.max(0, size - octets);
    const tampon = Buffer.alloc(size - debut);
    await poignee.read(tampon, 0, tampon.length, debut);
    const lignes = tampon.toString("utf8").split("\n");
    if (debut > 0) lignes.shift();
    return lignes;
  } finally {
    await poignee.close();
  }
}

async function lireLignes(source: SourceJournal) {
  const lectures = await Promise.all(source.fichiers.map(async (fichier) => ({ fichier, lignes: await lireFinFichier(fichier.chemin) })));
  const lignes: LigneJournal[] = [];
  for (const { fichier, lignes: brutes } of lectures) {
    for (const brute of brutes ?? []) {
      const ligne = analyserLigne(brute, fichier);
      if (ligne) lignes.push(ligne);
    }
  }
  const horodate = lignes.length > 0 && lignes.every((ligne) => ligne.heure !== null);
  if (horodate) lignes.sort((a, b) => (a.heure ?? "").localeCompare(b.heure ?? ""));
  return { lignes, horodate, existe: lectures.some((lecture) => lecture.lignes !== null) };
}

export function compterErreursRecentes(lignes: LigneJournal[], maintenant: number): number | null {
  if (lignes.length > 0 && lignes.some((ligne) => ligne.heure === null)) return null;
  return lignes.filter((ligne) => ligne.niveau === "erreur" && ligne.heure !== null && maintenant - Date.parse(ligne.heure) < UNE_HEURE).length;
}

export function creerJournauxServeur({ sources = listerSourcesConnues, horloge = () => Date.now() }: { sources?: () => SourceJournal[]; horloge?: () => number } = {}) {
  async function listerSources() {
    const liste = sources();
    return {
      sources: await Promise.all(
        liste.map(async (source) => {
          const { lignes, horodate, existe } = await lireLignes(source);
          return { id: source.id, nom: source.nom, existe, horodate, erreursRecentes: compterErreursRecentes(lignes, horloge()) };
        }),
      ),
    };
  }

  async function lireJournal(id: string, filtre: "tout" | "problemes") {
    const source = sources().find((element) => element.id === id);
    if (!source) return null;
    const { lignes, horodate, existe } = await lireLignes(source);
    const gardees = filtre === "problemes" ? lignes.filter((ligne) => ligne.niveau !== "info") : lignes;
    return {
      id: source.id,
      nom: source.nom,
      fichiers: source.fichiers.map((fichier) => fichier.chemin),
      existe,
      horodate,
      total: lignes.length,
      lignes: gardees.slice(-LIGNES_MAX),
    };
  }

  return { listerSources, lireJournal };
}

export const journauxServeur = creerJournauxServeur();
