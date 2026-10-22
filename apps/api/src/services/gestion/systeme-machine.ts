import { execFile } from "node:child_process";
import { X509Certificate } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { cpus, release } from "node:os";

export type ServiceSysteme = { readonly unite: string; readonly nom: string; readonly role: string };
export type EtatServiceSysteme = ServiceSysteme & { actif: boolean; etat: string };
export type Gourmand = { nom: string; coeurs: number; role: string | null };
export type SanteSysteme = {
  systeme: string | null;
  noyau: string;
  processeur: { modele: string | null; coeurs: number };
  misesAJour: number | null;
  redemarrageDemande: boolean;
  certificat: { domaine: string; valableJusquau: string | null };
};
export type ExecuterCommande = (commande: string, arguments_: string[], delai: number) => Promise<string>;

export const SERVICES_SYSTEME: readonly ServiceSysteme[] = Object.freeze([
  Object.freeze({ unite: "nginx", nom: "nginx", role: "Le portier : sosmiam.fr, l'API de gestion, les autres sites" }),
  Object.freeze({ unite: "postgresql", nom: "PostgreSQL", role: "La base de SOS Miam" }),
  Object.freeze({ unite: "stalwart", nom: "Stalwart", role: "Le serveur de mail du VPS" }),
  Object.freeze({ unite: "mariadb", nom: "MariaDB", role: "Les bases des sites iodev.fr" }),
  Object.freeze({ unite: "php8.2-fpm", nom: "PHP-FPM 8.2", role: "Le webmail et les sites iodev.fr" }),
  Object.freeze({ unite: "pm2-root", nom: "pm2", role: "Fait tourner l'API, le site et le bot" }),
]);

const ROLES_PROGRAMMES: Readonly<Record<string, string>> = Object.freeze({
  node: "Programmes Node : API, sites, bots",
  npm: "Programmes lancés par npm : API, sites",
  postgres: "La base de données",
  nginx: "Le portier des sites",
  git: "Git, le dépôt du projet",
  "chrome-headless": "Le navigateur des essais (captures d'écran)",
  chrome: "Le navigateur des essais (captures d'écran)",
  chromium: "Le navigateur des essais (captures d'écran)",
  python3: "Un script Python",
  claude: "Les sessions de travail Claude",
  stalwart: "Le serveur de mail",
  mariadbd: "Les bases des sites iodev.fr",
  "php-fpm8.2": "Les sites iodev.fr (PHP)",
  esbuild: "Une compilation",
  tsc: "Une compilation",
  sshd: "Les connexions au serveur",
  ngrok: "Le tunnel du serveur de l'app (Expo)",
  MainThread: "Un outil de VS Code à distance",
  "PM2": "pm2, le chef des programmes",
});

const DELAI_COMMANDE = 8_000;
const DUREE_CACHE_MISES_A_JOUR = 3_600_000;
const DUREE_CACHE_GOURMANDS = 15_000;
const CERTIFICAT_SITE = process.env.CERTIFICAT_SITE || "/etc/ssl/cloudflare/sosmiam.fr.crt";

export function creerExecuteurCommande(): ExecuterCommande {
  return (commande, arguments_, delai) =>
    new Promise((resoudre, rejeter) => {
      execFile(
        commande,
        arguments_,
        {
          timeout: delai, killSignal: "SIGKILL", maxBuffer: 4 * 1024 * 1024, shell: false, windowsHide: true,
          env: { PATH: process.env.PATH ?? "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", LC_ALL: "C" },
        },
        (erreur, sortie) => {
          if (erreur && !String(sortie ?? "").trim()) return rejeter(erreur);
          resoudre(String(sortie));
        },
      );
    });
}

export function lireEtatsServices(sortie: string): EtatServiceSysteme[] {
  const etats = sortie.split("\n").map((ligne) => ligne.trim()).filter(Boolean);
  return SERVICES_SYSTEME.map((service, rang) => {
    const etat = etats[rang] ?? "inconnu";
    return { ...service, etat, actif: etat === "active" };
  });
}

export function decrireProgramme(nom: string): string | null {
  if (nom.startsWith("code-")) return "VS Code, à distance";
  return ROLES_PROGRAMMES[nom] ?? null;
}

export function lireSortieTop(sortie: string, combien = 5): Gourmand[] {
  const blocs = sortie.split(/^top - /m);
  const lignes = (blocs[blocs.length - 1] ?? "").split("\n");
  const rangEntete = lignes.findIndex((ligne) => /^\s*PID\s+USER\b/.test(ligne));
  if (rangEntete < 0) return [];
  const colonnes = (lignes[rangEntete] ?? "").trim().split(/\s+/);
  const rangProcesseur = colonnes.indexOf("%CPU");
  const rangCommande = colonnes.indexOf("COMMAND");
  if (rangProcesseur < 0 || rangCommande < 0) return [];
  const totaux = new Map<string, number>();
  for (const ligne of lignes.slice(rangEntete + 1)) {
    const morceaux = ligne.trim().split(/\s+/);
    if (morceaux.length <= rangCommande) continue;
    const part = Number(morceaux[rangProcesseur]);
    const nom = (morceaux[rangCommande] ?? "").split("/")[0] ?? "";
    if (!nom || nom === "top" || !Number.isFinite(part) || part <= 0) continue;
    totaux.set(nom, (totaux.get(nom) ?? 0) + part);
  }
  return [...totaux.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, combien)
    .map(([nom, part]) => ({ nom, coeurs: Math.round(part) / 100, role: decrireProgramme(nom) }));
}

export function compterMisesAJour(sortie: string): number {
  return sortie.split("\n").filter((ligne) => /\[upgradable from:/.test(ligne)).length;
}

export function lireNomSysteme(osRelease: string): string | null {
  const trouve = /^PRETTY_NAME="?([^"\n]+)"?$/m.exec(osRelease);
  return trouve?.[1]?.trim() || null;
}

export function creerSystemeMachine({ executer = creerExecuteurCommande(), horloge = () => Date.now() }: { executer?: ExecuterCommande; horloge?: () => number } = {}) {
  let misesAJour: { le: number; nombre: number | null } | null = null;
  let gourmands: { le: number; liste: Gourmand[] } | null = null;
  let lectureGourmands: Promise<Gourmand[]> | null = null;

  async function lireServices(): Promise<EtatServiceSysteme[]> {
    return lireEtatsServices(await executer("systemctl", ["is-active", ...SERVICES_SYSTEME.map((service) => service.unite)], DELAI_COMMANDE));
  }

  async function lireMisesAJour(): Promise<number | null> {
    if (misesAJour && horloge() - misesAJour.le < DUREE_CACHE_MISES_A_JOUR) return misesAJour.nombre;
    const nombre = await executer("apt", ["list", "--upgradable"], 30_000).then(compterMisesAJour, () => null);
    misesAJour = { le: horloge(), nombre };
    return nombre;
  }

  async function lireGourmands(): Promise<Gourmand[]> {
    if (gourmands && horloge() - gourmands.le < DUREE_CACHE_GOURMANDS) return gourmands.liste;
    lectureGourmands ??= executer("top", ["-b", "-n", "2", "-d", "0.5", "-w", "200"], DELAI_COMMANDE)
      .then((sortie) => {
        const liste = lireSortieTop(sortie);
        gourmands = { le: horloge(), liste };
        return liste;
      })
      .finally(() => {
        lectureGourmands = null;
      });
    return lectureGourmands;
  }

  async function lireSante(): Promise<SanteSysteme> {
    const [osRelease, validite, redemarrageDemande, nombre] = await Promise.all([
      readFile("/etc/os-release", "utf8").catch(() => ""),
      readFile(CERTIFICAT_SITE, "utf8").then((texte) => new X509Certificate(texte).validTo, () => null),
      access("/var/run/reboot-required").then(() => true, () => false),
      lireMisesAJour(),
    ]);
    const processeurs = cpus();
    const fin = validite ? new Date(validite) : null;
    return {
      systeme: lireNomSysteme(osRelease),
      noyau: release(),
      processeur: { modele: processeurs[0]?.model.replace(/\s+/g, " ").trim() || null, coeurs: processeurs.length },
      misesAJour: nombre,
      redemarrageDemande,
      certificat: { domaine: "sosmiam.fr", valableJusquau: fin && !Number.isNaN(fin.getTime()) ? fin.toISOString() : null },
    };
  }

  return { lireServices, lireSante, lireGourmands };
}

export const systemeMachine = creerSystemeMachine();
