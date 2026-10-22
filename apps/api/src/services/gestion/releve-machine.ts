import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { resumerErreur } from "../../fonctions/comptes/resumer-erreur.ts";
import { creerLecteurMachine, type Instantane } from "./mesures-machine.ts";
import { systemeMachine, type EtatServiceSysteme } from "./systeme-machine.ts";

export type PointMachine = {
  le: string;
  processeur: number | null;
  memoire: number | null;
  recu: number | null;
  envoye: number | null;
  disque: number | null;
  temperature: number | null;
};

export const PERIODES_COURBES = ["1h", "24h", "7j", "30j"] as const;
export type PeriodeCourbes = (typeof PERIODES_COURBES)[number];

const MINUTE = 60_000;
const HEURE = 3_600_000;
const GARDE_MINUTES = 24 * HEURE;
const GARDE_HEURES = 30 * 24 * HEURE;
export const SEUILS_MACHINE = Object.freeze({ processeur: 90, processeurMinutes: 10, memoire: 0.9, temperature: 80, silence: 3 * MINUTE });

const DECOUPAGE: Readonly<Record<PeriodeCourbes, { source: "minutes" | "heures"; duree: number; pas: number }>> = Object.freeze({
  "1h": { source: "minutes", duree: HEURE, pas: MINUTE },
  "24h": { source: "minutes", duree: 24 * HEURE, pas: 10 * MINUTE },
  "7j": { source: "heures", duree: 7 * 24 * HEURE, pas: HEURE },
  "30j": { source: "heures", duree: 30 * 24 * HEURE, pas: 6 * HEURE },
});

type CleMesure = Exclude<keyof PointMachine, "le">;
const CLES: readonly CleMesure[] = ["processeur", "memoire", "recu", "envoye", "disque", "temperature"];
const ARRONDIS: Readonly<Record<CleMesure, number>> = Object.freeze({ processeur: 10, memoire: 1, recu: 1, envoye: 1, disque: 1, temperature: 10 });

const arrondir = (cle: CleMesure, valeur: number | null) => (valeur === null ? null : Math.round(valeur * ARRONDIS[cle]) / ARRONDIS[cle]);

function estPoint(valeur: unknown): valeur is PointMachine {
  if (typeof valeur !== "object" || valeur === null) return false;
  const point = valeur as Record<string, unknown>;
  return typeof point.le === "string" && !Number.isNaN(Date.parse(point.le)) && CLES.every((cle) => point[cle] === null || typeof point[cle] === "number");
}

export function moyenner(points: PointMachine[], le: string): PointMachine {
  const resultat: PointMachine = { le, processeur: null, memoire: null, recu: null, envoye: null, disque: null, temperature: null };
  for (const cle of CLES) {
    const valeurs = points.map((point) => point[cle]).filter((valeur): valeur is number => typeof valeur === "number");
    resultat[cle] = valeurs.length ? arrondir(cle, valeurs.reduce((somme, valeur) => somme + valeur, 0) / valeurs.length) : null;
  }
  return resultat;
}

export function regrouper(points: PointMachine[], debut: number, fin: number, pas: number): PointMachine[] {
  const paquets = new Map<number, PointMachine[]>();
  for (const point of points) {
    const moment = Date.parse(point.le);
    if (moment < debut || moment > fin) continue;
    const cle = Math.floor(moment / pas) * pas;
    const paquet = paquets.get(cle);
    if (paquet) paquet.push(point);
    else paquets.set(cle, [point]);
  }
  return [...paquets.entries()].sort((a, b) => a[0] - b[0]).map(([cle, paquet]) => moyenner(paquet, new Date(cle).toISOString()));
}

export function calculerPoint(avant: Instantane, apres: Instantane): PointMachine {
  const duree = (apres.le - avant.le) / 1000;
  let processeur: number | null = null;
  if (avant.processeur && apres.processeur) {
    const total = apres.processeur.total - avant.processeur.total;
    const inactif = apres.processeur.inactif - avant.processeur.inactif;
    if (total > 0 && inactif >= 0) processeur = Math.min(100, Math.max(0, (1 - inactif / total) * 100));
  }
  let recu: number | null = null;
  let envoye: number | null = null;
  if (avant.reseau && apres.reseau && duree > 0 && avant.reseau.interface === apres.reseau.interface) {
    const ecartRecu = apres.reseau.recu - avant.reseau.recu;
    const ecartEnvoye = apres.reseau.envoye - avant.reseau.envoye;
    if (ecartRecu >= 0) recu = ecartRecu / duree;
    if (ecartEnvoye >= 0) envoye = ecartEnvoye / duree;
  }
  return {
    le: new Date(apres.le).toISOString(),
    processeur: arrondir("processeur", processeur),
    memoire: apres.memoire ? apres.memoire.total - apres.memoire.disponible : null,
    recu: arrondir("recu", recu),
    envoye: arrondir("envoye", envoye),
    disque: apres.disque?.utilise ?? null,
    temperature: arrondir("temperature", apres.temperature),
  };
}

type Options = {
  dossier?: string;
  lire?: () => Promise<Instantane>;
  lireServices?: () => Promise<EtatServiceSysteme[]>;
  horloge?: () => number;
};

export function creerReleveMachine({
  dossier = process.env.DOSSIER_MESURES || "/var/lib/sos-miam/mesures-serveur",
  lire = creerLecteurMachine(),
  lireServices,
  horloge = () => Date.now(),
}: Options = {}) {
  const fichier = join(dossier, "mesures-machine.json");
  let minutes: PointMachine[] = [];
  let heures: PointMachine[] = [];
  let precedent: Instantane | null = null;
  let services: EtatServiceSysteme[] | null = null;
  let chargement: Promise<void> | null = null;
  let ecriture: Promise<void> = Promise.resolve();

  function charger() {
    chargement ??= readFile(fichier, "utf8")
      .then((texte) => {
        const brut = JSON.parse(texte) as { minutes?: unknown; heures?: unknown };
        minutes = Array.isArray(brut.minutes) ? brut.minutes.filter(estPoint) : [];
        heures = Array.isArray(brut.heures) ? brut.heures.filter(estPoint) : [];
      })
      .catch(() => {});
    return chargement;
  }

  async function sauver() {
    await mkdir(dossier, { recursive: true, mode: 0o700 });
    const temporaire = `${fichier}.en-cours`;
    await writeFile(temporaire, JSON.stringify({ version: 1, minutes, heures }), { mode: 0o600 });
    await rename(temporaire, fichier);
  }

  async function relever(): Promise<PointMachine | null> {
    await charger();
    const instantane = await lire();
    const avant = precedent;
    precedent = instantane;
    if (lireServices) services = await lireServices().catch(() => null);
    if (!avant) return null;
    const point = calculerPoint(avant, instantane);
    minutes = [...minutes.filter((ancien) => Date.parse(ancien.le) > instantane.le - GARDE_MINUTES), point];
    const debutHeure = Math.floor(instantane.le / HEURE) * HEURE;
    const cetteHeure = moyenner(minutes.filter((ancien) => Date.parse(ancien.le) >= debutHeure), new Date(debutHeure).toISOString());
    heures = [...heures.filter((ancien) => Date.parse(ancien.le) > instantane.le - GARDE_HEURES && ancien.le !== cetteHeure.le), cetteHeure];
    ecriture = ecriture.then(sauver).catch((erreur: unknown) => console.error("Mesures du serveur : écriture impossible :", resumerErreur(erreur)));
    await ecriture;
    return point;
  }

  async function lireCourbes(periode: PeriodeCourbes) {
    await charger();
    const decoupage = DECOUPAGE[periode];
    const fin = horloge();
    const debut = fin - decoupage.duree;
    const source = decoupage.source === "minutes" ? minutes : heures;
    return {
      periode,
      pas: decoupage.pas,
      debut: new Date(debut).toISOString(),
      fin: new Date(fin).toISOString(),
      memoireTotale: precedent?.memoire?.total ?? null,
      disqueTotal: precedent?.disque?.total ?? null,
      coeurs: precedent?.coeurs ?? null,
      points: decoupage.pas === MINUTE ? source.filter((point) => Date.parse(point.le) >= debut) : regrouper(source, debut, fin, decoupage.pas),
    };
  }

  function lireMaintenant() {
    if (!precedent) return null;
    const releveLe = precedent.le;
    const dernier = minutes.at(-1);
    const frais = dernier && Date.parse(dernier.le) >= releveLe - 2 * MINUTE ? dernier : null;
    return {
      releveLe: new Date(precedent.le).toISOString(),
      coeurs: precedent.coeurs,
      charge: precedent.charge,
      processeur: frais?.processeur ?? null,
      memoire: precedent.memoire ? { utilisee: precedent.memoire.total - precedent.memoire.disponible, totale: precedent.memoire.total } : null,
      echange: precedent.echange ? { utilise: precedent.echange.total - precedent.echange.libre, total: precedent.echange.total } : null,
      disque: precedent.disque ? { total: precedent.disque.total, libre: precedent.disque.libre } : null,
      reseau: precedent.reseau
        ? { interface: precedent.reseau.interface, recu: frais?.recu ?? null, envoye: frais?.envoye ?? null, totalRecu: precedent.reseau.recu, totalEnvoye: precedent.reseau.envoye }
        : null,
      temperature: precedent.temperature,
      allumeDepuis: precedent.allumeDepuis ? new Date(precedent.allumeDepuis).toISOString() : null,
      derniereHeure: minutes.filter((point) => Date.parse(point.le) > releveLe - HEURE).map((point) => ({ le: point.le, processeur: point.processeur, envoye: point.envoye })),
    };
  }

  function lireProblemes(): string[] {
    if (!precedent) return [];
    const maintenant = horloge();
    const problemes: string[] = [];
    const silence = maintenant - precedent.le;
    if (silence > SEUILS_MACHINE.silence) problemes.push(`Le relevé du serveur ne répond plus depuis ${Math.round(silence / MINUTE)} minutes.`);
    const recents = minutes.filter((point) => Date.parse(point.le) > maintenant - (SEUILS_MACHINE.processeurMinutes + 0.5) * MINUTE);
    if (recents.length >= SEUILS_MACHINE.processeurMinutes && recents.every((point) => (point.processeur ?? 0) > SEUILS_MACHINE.processeur)) {
      problemes.push(`Le processeur tourne à plus de ${SEUILS_MACHINE.processeur} % depuis ${SEUILS_MACHINE.processeurMinutes} minutes.`);
    }
    if (precedent.memoire && precedent.memoire.total > 0) {
      const part = 1 - precedent.memoire.disponible / precedent.memoire.total;
      if (part >= SEUILS_MACHINE.memoire) problemes.push(`La mémoire du serveur est pleine à ${Math.round(part * 100)} %.`);
    }
    if (precedent.temperature !== null && precedent.temperature >= SEUILS_MACHINE.temperature) problemes.push(`Le processeur chauffe : ${Math.round(precedent.temperature)} °C.`);
    for (const service of services ?? []) if (!service.actif) problemes.push(`Le service ${service.nom} est arrêté.`);
    return problemes;
  }

  function demarrer(intervalle = MINUTE) {
    const tour = () => void relever().catch((erreur: unknown) => console.error("Mesures du serveur :", resumerErreur(erreur)));
    tour();
    const premier = setTimeout(tour, 5_000);
    const minuteur = setInterval(tour, intervalle);
    premier.unref();
    minuteur.unref();
    return () => {
      clearTimeout(premier);
      clearInterval(minuteur);
    };
  }

  return { relever, lireCourbes, lireMaintenant, lireProblemes, demarrer, lireServicesConnus: () => services };
}

export const releveMachine = creerReleveMachine({ lireServices: systemeMachine.lireServices });
