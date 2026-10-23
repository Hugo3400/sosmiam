import { readFileSync } from "node:fs";

import { FORME_ID_GIF, GIFS_PAR_PAGE } from "../../../../packages/commun/src/regles/chat.ts";
import type { GifApi } from "../../../../packages/commun/src/types/messagerie.ts";
import { choisirRenduGif } from "../fonctions/gif/choisir-rendu-gif.ts";

export const FICHIER_CLE_GIPHY_DEFAUT = "/root/sos-miam-secrets/giphy-cle.txt";
const ADRESSE_GIPHY = "https://api.giphy.com/v1/gifs";
export const DELAI_GIPHY_MS = 4_000;
export const DUREE_CACHE_GIF_MS = 10 * 60_000;
const MAX_PAGES_GARDEES = 200;
const MAX_GIFS_GARDES = 1_000;
const HEURE_MS = 60 * 60_000;
export const APPELS_GIPHY_PAR_HEURE = 100;
const MAX_COMPTES_SUIVIS = 5_000;
const CLASSES_PERMISES: ReadonlySet<string> = new Set(["g", "pg", "pg-13"]);
const FORME_CLE = /^[A-Za-z0-9]{16,128}$/;

export type GifLu = GifApi | "inconnu" | "refuse" | "indisponible";

export interface ClientGif {
  tendances(page: number, compteId?: number): Promise<GifApi[] | "indisponible">;
  chercher(q: string, page: number, compteId?: number): Promise<GifApi[] | "indisponible">;
  lire(id: string, compteId?: number): Promise<GifLu>;
}

export function chargerCleGiphy(chemin: string = process.env.SOS_MIAM_GIPHY_CLE_FICHIER || FICHIER_CLE_GIPHY_DEFAUT): string | null {
  try {
    const cle = readFileSync(chemin, "utf8").trim();
    return FORME_CLE.test(cle) ? cle : null;
  } catch {
    return null;
  }
}

function creerMemoire<T>(max: number, duree: number, horloge: () => number) {
  const entrees = new Map<string, { valeur: T; expire: number }>();
  return {
    lire(cle: string): T | undefined {
      const entree = entrees.get(cle);
      if (!entree) return undefined;
      if (entree.expire <= horloge()) {
        entrees.delete(cle);
        return undefined;
      }
      return entree.valeur;
    },
    ecrire(cle: string, valeur: T) {
      entrees.delete(cle);
      entrees.set(cle, { valeur, expire: horloge() + duree });
      for (const plusAncienne of entrees.keys()) {
        if (entrees.size <= max) break;
        entrees.delete(plusAncienne);
      }
    },
  };
}

const estPermis = (brut: unknown) => {
  const classe = typeof brut === "object" && brut !== null ? (brut as { rating?: unknown }).rating : undefined;
  return typeof classe === "string" && CLASSES_PERMISES.has(classe);
};

export function creerClientGiphy(o: { cle: string; fetch?: typeof fetch; horloge?: () => number; appelsParHeure?: number; appelsParCompteParHeure?: number }): ClientGif {
  const lireFetch = o.fetch ?? fetch;
  const horloge = o.horloge ?? Date.now;
  const plafond = o.appelsParHeure ?? APPELS_GIPHY_PAR_HEURE;
  const plafondCompte = o.appelsParCompteParHeure ?? Math.max(5, Math.floor(plafond / 5));
  const parCompte = new Map<number, number[]>();
  const pages = creerMemoire<GifApi[]>(MAX_PAGES_GARDEES, DUREE_CACHE_GIF_MS, horloge);
  const gifs = creerMemoire<GifApi>(MAX_GIFS_GARDES, DUREE_CACHE_GIF_MS, horloge);
  const enCours = new Map<string, Promise<GifApi[] | "indisponible">>();
  const appels: number[] = [];

  const oublierVieux = (liste: number[], maintenant: number) => {
    while (liste.length > 0 && liste[0]! <= maintenant - HEURE_MS) liste.shift();
  };

  function prendreUnAppel(compteId: number | undefined): boolean {
    const maintenant = horloge();
    oublierVieux(appels, maintenant);
    if (appels.length >= plafond) return false;
    if (compteId !== undefined) {
      if (parCompte.size > MAX_COMPTES_SUIVIS) for (const [id, liste] of parCompte) if ((oublierVieux(liste, maintenant), liste.length === 0)) parCompte.delete(id);
      const siens = parCompte.get(compteId) ?? [];
      oublierVieux(siens, maintenant);
      if (siens.length >= plafondCompte) return false;
      siens.push(maintenant);
      parCompte.set(compteId, siens);
    }
    appels.push(maintenant);
    return true;
  }

  async function demander(chemin: string, parametres: Record<string, string>, compteId?: number): Promise<{ statut: number; corps: unknown } | "indisponible"> {
    if (!prendreUnAppel(compteId)) return "indisponible";
    try {
      const reponse = await lireFetch(`${ADRESSE_GIPHY}${chemin}?${new URLSearchParams({ api_key: o.cle, ...parametres }).toString()}`, {
        headers: { Accept: "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(DELAI_GIPHY_MS),
      });
      if (!reponse.ok) {
        console.error(`GIPHY : statut ${reponse.status}`);
        return reponse.status === 404 ? { statut: 404, corps: null } : "indisponible";
      }
      return { statut: reponse.status, corps: await reponse.json() };
    } catch {
      console.error("GIPHY : pas de réponse à temps");
      return "indisponible";
    }
  }

  function lirePage(corps: unknown): GifApi[] {
    const donnees = typeof corps === "object" && corps !== null ? (corps as { data?: unknown }).data : undefined;
    if (!Array.isArray(donnees)) return [];
    const vus = new Set<string>();
    return donnees.flatMap((brut) => {
      const gif = estPermis(brut) ? choisirRenduGif(brut) : null;
      if (!gif || vus.has(gif.id)) return [];
      vus.add(gif.id);
      gifs.ecrire(gif.id, gif);
      return [gif];
    });
  }

  function lister(cle: string, chemin: string, parametres: Record<string, string>, compteId?: number): Promise<GifApi[] | "indisponible"> {
    const garde = pages.lire(cle);
    if (garde) return Promise.resolve(garde);
    const deja = enCours.get(cle);
    if (deja) return deja;
    const promesse = demander(chemin, parametres, compteId).then((r) => {
      if (r === "indisponible" || r.statut !== 200) return "indisponible" as const;
      const page = lirePage(r.corps);
      pages.ecrire(cle, page);
      return page;
    }).finally(() => enCours.delete(cle));
    enCours.set(cle, promesse);
    return promesse;
  }

  const pagination = (page: number) => ({ limit: String(GIFS_PAR_PAGE), offset: String(page * GIFS_PAR_PAGE), rating: "pg-13", bundle: "messaging_non_clips" });

  return {
    tendances: (page, compteId) => lister(`tendances|${page}`, "/trending", pagination(page), compteId),
    chercher: (q, page, compteId) => lister(`recherche|${page}|${q}`, "/search", { q, ...pagination(page), lang: "fr" }, compteId),
    async lire(id, compteId) {
      if (!FORME_ID_GIF.test(id)) return "inconnu";
      const garde = gifs.lire(id);
      if (garde) return garde;
      const r = await demander(`/${encodeURIComponent(id)}`, {}, compteId);
      if (r === "indisponible") return "indisponible";
      const donnees = typeof r.corps === "object" && r.corps !== null ? (r.corps as { data?: unknown }).data : undefined;
      if (r.statut === 404 || typeof donnees !== "object" || donnees === null || (donnees as { id?: unknown }).id !== id) return "inconnu";
      if (!estPermis(donnees)) return "refuse";
      const gif = choisirRenduGif(donnees);
      if (!gif) return "refuse";
      gifs.ecrire(gif.id, gif);
      return gif;
    },
  };
}

export function chargerClientGiphy(chemin?: string): ClientGif | null {
  const cle = chargerCleGiphy(chemin);
  if (!cle) {
    console.error("GIF indisponibles : pas de clé GIPHY lisible (les routes /app/gif répondent 503).");
    return null;
  }
  const plafond = Number(process.env.SOS_MIAM_GIPHY_APPELS_PAR_HEURE);
  return creerClientGiphy({ cle, appelsParHeure: Number.isInteger(plafond) && plafond > 0 ? plafond : undefined });
}
