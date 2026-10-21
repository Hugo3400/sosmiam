import { Worker } from "node:worker_threads";

export const TRAVAILLEURS_JPEG = 2;
export const ATTENTE_MAX_JPEG = 8;
export const BUDGET_JPEG_MS = 3000;

export type NettoyerJpeg = (octets: Uint8Array) => Promise<Buffer | null>;

export type ReglagesNettoyeurJpeg = { travailleurs?: number; attenteMax?: number; budgetMs?: number; script?: URL };

type Tache = { octets: Uint8Array; reussir: (propre: Buffer | null) => void; echouer: (erreur: Error) => void };
type Travailleur = { fil: Worker; tache: Tache | null; minuteur: NodeJS.Timeout | null };
type Reponse = { propre: Uint8Array | null } | { erreur: string };

const SCRIPT_TRAVAILLEUR = new URL("./nettoyeur-jpeg-travailleur.ts", import.meta.url);

const refuserOccupe = () => Object.assign(new Error("Trop de photos en attente de vérification"), { status: 503 });
const enBuffer = (octets: Uint8Array) => Buffer.from(octets.buffer, octets.byteOffset, octets.byteLength);

export function creerNettoyeurJpeg({
  travailleurs = TRAVAILLEURS_JPEG, attenteMax = ATTENTE_MAX_JPEG, budgetMs = BUDGET_JPEG_MS, script = SCRIPT_TRAVAILLEUR,
}: ReglagesNettoyeurJpeg = {}) {
  const fils = new Set<Travailleur>();
  const libres: Travailleur[] = [];
  const attente: Tache[] = [];
  let arrete = false;

  function lancer(): Travailleur {
    const t: Travailleur = { fil: new Worker(script), tache: null, minuteur: null };
    t.fil.on("message", (reponse: Reponse) => recevoir(t, reponse));
    t.fil.on("error", (erreur: Error) => perdre(t)?.echouer(erreur));
    t.fil.on("exit", () => perdre(t)?.echouer(new Error("Le nettoyeur de photos s'est arrêté")));
    fils.add(t);
    return t;
  }

  function confier(t: Travailleur, tache: Tache) {
    t.tache = tache;
    t.fil.ref();
    t.minuteur = setTimeout(() => {
      perdre(t)?.reussir(null);
      void t.fil.terminate();
    }, budgetMs);
    t.fil.postMessage(tache.octets);
  }

  function relancerAttente() {
    while (!arrete && attente.length > 0 && fils.size < travailleurs) confier(lancer(), attente.shift()!);
  }

  function perdre(t: Travailleur): Tache | null {
    if (!fils.delete(t)) return null;
    const place = libres.indexOf(t);
    if (place >= 0) libres.splice(place, 1);
    if (t.minuteur) clearTimeout(t.minuteur);
    const tache = t.tache;
    t.tache = null;
    t.minuteur = null;
    relancerAttente();
    return tache;
  }

  function liberer(t: Travailleur) {
    const suivante = attente.shift();
    if (suivante) return confier(t, suivante);
    t.fil.unref();
    libres.push(t);
  }

  function recevoir(t: Travailleur, reponse: Reponse) {
    const tache = t.tache;
    if (!tache) return;
    if (t.minuteur) clearTimeout(t.minuteur);
    t.tache = null;
    t.minuteur = null;
    liberer(t);
    if ("erreur" in reponse) tache.echouer(new Error(reponse.erreur));
    else tache.reussir(reponse.propre ? enBuffer(reponse.propre) : null);
  }

  function nettoyer(octets: Uint8Array): Promise<Buffer | null> {
    if (arrete) return Promise.reject(refuserOccupe());
    return new Promise((reussir, echouer) => {
      const tache: Tache = { octets, reussir, echouer };
      const libre = libres.pop() ?? (fils.size < travailleurs ? lancer() : null);
      if (libre) confier(libre, tache);
      else if (attente.length < attenteMax) attente.push(tache);
      else echouer(refuserOccupe());
    });
  }

  async function arreter(): Promise<void> {
    arrete = true;
    for (const tache of attente.splice(0)) tache.echouer(refuserOccupe());
    await Promise.all([...fils].map((t) => {
      perdre(t)?.echouer(refuserOccupe());
      return t.fil.terminate();
    }));
  }

  return { nettoyer, arreter };
}

const nettoyeur = creerNettoyeurJpeg();

export const nettoyerJpeg: NettoyerJpeg = (octets) => nettoyeur.nettoyer(octets);

export const arreterNettoyeurJpeg = (): Promise<void> => nettoyeur.arreter();
