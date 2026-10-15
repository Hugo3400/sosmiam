// Le « Pool » de pg pendant les essais : tout ce que Prisma envoie par son adaptateur pg (le client de l'essai comme le
// client global de connexion.ts, qui crée son pool à la première requête) part dans la base PGlite en mémoire, jamais sur
// le réseau. Les valeurs sont préparées comme pg les prépare et relues en texte par les parseurs de l'adaptateur.
//
// Par défaut, une transaction à la fois, comme le multiplexeur de pglite-socket : PGlite n'a qu'une session, la connexion
// prêtée garde donc la main jusqu'à release(), et une requête hors transaction attend son tour. Deux transactions « en même
// temps » s'y suivent toujours : l'attente sur un verrou n'est jamais rejouée (on lit le verrou lui-même, voir les essais
// des avis). Un code qui lit hors de sa transaction pendant qu'elle est ouverte (en production : sur une autre connexion du
// pool) y attendrait jusqu'à l'expiration de la transaction : l'essai choisit alors « mêlées » (tout passe dans la session
// unique, dans l'ordre d'arrivée ; la lecture hors transaction voit ce que la transaction a écrit), jamais pour un essai de
// concurrence.
import type { PGlite } from "@electric-sql/pglite";
import { createRequire } from "node:module";
import pg from "pg";

/** La préparation des valeurs de pg lui-même (pg/lib/utils.js n'a pas de types) */
const { prepareValue } = createRequire(import.meta.url)("pg/lib/utils.js") as { prepareValue: (valeur: unknown) => unknown };

type Parseur = (texte: string) => unknown;
type Requete = { text: string; values?: unknown[]; types?: { getTypeParser: (oid: number, format: string) => Parseur } };

/** Au-delà, une requête qui attend son tour signale un interblocage (une requête hors de la transaction ouverte ?) */
const ATTENTE_MAX_MS = 15_000;

export type ModeTransactions = "a-la-suite" | "melees";

let baseCourante: PGlite | null = null;
let mode: ModeTransactions = "a-la-suite";
let file: Promise<void> = Promise.resolve();

/** La base PGlite où partent les requêtes des pools (null : aucune, toute requête est refusée) */
export function brancherPoolSur(db: PGlite | null, transactions: ModeTransactions = "a-la-suite"): void {
  baseCourante = db;
  mode = transactions;
}

const SERIALISEURS = new Proxy({}, { get: () => (valeur: unknown) => prepareValue(valeur) });

/** PGlite découpe toujours les tableaux : on les remet en littéral PostgreSQL pour le parseur de pg */
const enLitteral = (v: unknown): unknown =>
  Array.isArray(v) ? `{${v.map((e) => (e === null ? "NULL" : Array.isArray(e) ? enLitteral(e) : `"${String(e).replace(/(["\\])/g, "\\$1")}"`)).join(",")}}` : v;

async function executer(cfg: Requete | string, valeurs?: unknown[]) {
  if (baseCourante === null) throw new Error("Garde-fou des essais : la base en mémoire n'est pas créée (creerBaseEnMemoire).");
  const c = typeof cfg === "string" ? { text: cfg, values: valeurs } : cfg;
  const r = await baseCourante.query(c.text, c.values ?? [], { rowMode: "array", serializers: SERIALISEURS });
  const lire = r.fields.map((f) => (c.types ? c.types.getTypeParser(f.dataTypeID, "text") : (x: string) => x));
  const rows = (r.rows as unknown[][]).map((ligne) => ligne.map((v, i) => (v === null ? null : lire[i]!(enLitteral(v) as string))));
  return { fields: r.fields, rows, rowCount: r.affectedRows ?? r.rows.length, command: "" };
}

/** Attend son tour dans la file ; rend la fonction qui passe la main (une seule fois) */
async function prendreLaMain(): Promise<() => void> {
  if (mode === "melees") return () => undefined;
  let rendre!: () => void;
  const tour = new Promise<void>((r) => (rendre = r));
  const avant = file;
  file = avant.then(() => tour);
  let minuterie: NodeJS.Timeout | undefined;
  const delai = new Promise<never>((_, refuser) => {
    minuterie = setTimeout(() => refuser(new Error(`Base d'essai : une requête attend depuis ${ATTENTE_MAX_MS / 1000} s la fin d'une transaction (PGlite n'a qu'une session : une requête hors de la transaction pendant qu'elle est ouverte ?)`)), ATTENTE_MAX_MS);
  });
  try {
    await Promise.race([avant, delai]);
  } catch (erreur) {
    // Sa place dans la file passe d'elle-même quand son tour arrive
    void avant.then(rendre);
    throw erreur;
  } finally {
    clearTimeout(minuterie);
  }
  let rendu = false;
  return () => {
    if (rendu) return;
    rendu = true;
    rendre();
  };
}

/** Remplace query, connect et end de TOUS les pools pg (ceux déjà créés compris) */
export function remplacerPoolPg(): void {
  const methodes = {
    async query(cfg: Requete | string, valeurs?: unknown[]) {
      const passerLaMain = await prendreLaMain();
      try {
        return await executer(cfg, valeurs);
      } finally {
        passerLaMain();
      }
    },
    async connect() {
      const passerLaMain = await prendreLaMain();
      return { query: executer, release: () => passerLaMain(), on() {}, removeListener() {} };
    },
    async end() {},
  };
  for (const [nom, valeur] of Object.entries(methodes)) {
    Object.defineProperty(pg.Pool.prototype, nom, { value: valeur, configurable: true, writable: true });
  }
}
